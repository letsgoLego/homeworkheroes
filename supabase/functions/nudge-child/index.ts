import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Module-level VAPID cache — survives across warm invocations
let cachedVapid: { publicKey: string; privateKey: string } | null = null;
async function getVapidKeys(admin: ReturnType<typeof createClient>) {
  if (cachedVapid) return cachedVapid;
  const { data: pub } = await admin.from("app_config").select("value").eq("key", "vapid_public_key").single();
  const { data: priv } = await admin.from("app_config").select("value").eq("key", "vapid_private_key").single();
  if (!pub || !priv) return null;
  cachedVapid = { publicKey: pub.value as string, privateKey: priv.value as string };
  return cachedVapid;
}

// ====== Web Push (copied from send-notifications, trimmed comments) ======
function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function concatBuffers(...buffers: Uint8Array[]): Uint8Array {
  const total = buffers.reduce((s, b) => s + b.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const b of buffers) { result.set(b, offset); offset += b.length; }
  return result;
}
async function createVapidJwt(endpoint: string, vapidPublicKey: string, vapidPrivateKey: string) {
  const audience = new URL(endpoint).origin;
  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
  const publicKeyBytes = base64UrlDecode(vapidPublicKey);
  const x = base64UrlEncode(publicKeyBytes.slice(1, 33));
  const y = base64UrlEncode(publicKeyBytes.slice(33, 65));
  const jwk = { kty: "EC", crv: "P-256", x, y, d: vapidPrivateKey };
  const privateKey = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const header = { typ: "JWT", alg: "ES256" };
  const payload = { aud: audience, exp, sub: "mailto:notifications@laxhjalp.app" };
  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const input = `${headerB64}.${payloadB64}`;
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, new TextEncoder().encode(input));
  return { authorization: `vapid t=${input}.${base64UrlEncode(sig)}, k=${vapidPublicKey}` };
}
async function encryptPayload(payload: string, subscriberPublicKey: string, subscriberAuth: string) {
  const payloadBytes = new TextEncoder().encode(payload);
  const localKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const localPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey("raw", localKeyPair.publicKey));
  const subscriberKeyBytes = base64UrlDecode(subscriberPublicKey);
  const subscriberKey = await crypto.subtle.importKey("raw", subscriberKeyBytes, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const sharedSecretBits = await crypto.subtle.deriveBits({ name: "ECDH", public: subscriberKey }, localKeyPair.privateKey, 256);
  const sharedSecret = new Uint8Array(sharedSecretBits);
  const authBytes = base64UrlDecode(subscriberAuth);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const authInfo = concatBuffers(new TextEncoder().encode("WebPush: info\0"), subscriberKeyBytes, localPublicKeyRaw);
  const prkKey = await crypto.subtle.importKey("raw", sharedSecret, { name: "HKDF" }, false, ["deriveBits"]);
  const ikm = new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: authBytes, info: authInfo }, prkKey, 256));
  const cekInfo = concatBuffers(new TextEncoder().encode("Content-Encoding: aes128gcm\0"));
  const ikmKey = await crypto.subtle.importKey("raw", ikm, { name: "HKDF" }, false, ["deriveBits"]);
  const cekBits = await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: cekInfo }, ikmKey, 128);
  const nonceInfo = concatBuffers(new TextEncoder().encode("Content-Encoding: nonce\0"));
  const nonceBits = await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: nonceInfo }, ikmKey, 96);
  const nonce = new Uint8Array(nonceBits);
  const cek = await crypto.subtle.importKey("raw", cekBits, { name: "AES-GCM" }, false, ["encrypt"]);
  const padded = concatBuffers(payloadBytes, new Uint8Array([2]));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cek, padded));
  const rs = new Uint8Array(4); new DataView(rs.buffer).setUint32(0, 4096);
  const body = concatBuffers(salt, rs, new Uint8Array([localPublicKeyRaw.length]), localPublicKeyRaw, encrypted);
  return { body, headers: { "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream" } };
}
async function sendPush(endpoint: string, p256dh: string, authKey: string, vpk: string, vsk: string, payload: string) {
  try {
    const { authorization } = await createVapidJwt(endpoint, vpk, vsk);
    const { body, headers } = await encryptPayload(payload, p256dh, authKey);
    const res = await fetch(endpoint, { method: "POST", headers: { ...headers, Authorization: authorization, TTL: "86400" }, body });
    if (res.status === 410 || res.status === 404) return false;
    if (!res.ok) { console.error("push failed", res.status, await res.text()); return false; }
    return true;
  } catch (e) { console.error("push error", e); return false; }
}

// ====== Handler ======
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // User-scoped client to identify the caller and to insert into nudges (RLS does the validation)
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const fromUserId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const childId = typeof body.child_id === "string" ? body.child_id : null;
    const tone = typeof body.tone === "string" ? body.tone : "custom";
    let message = typeof body.message === "string" ? body.message.trim() : "";
    const allowedTones = ["snall", "peppig", "bestamd", "custom"];
    if (!childId || !allowedTones.includes(tone)) {
      return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (message.length === 0) message = defaultMessage(tone);
    if (message.length > 200) message = message.slice(0, 200);

    // Look up child + family using service client
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: child } = await admin.from("children").select("id, name, family_id").eq("id", childId).maybeSingle();
    if (!child) {
      return new Response(JSON.stringify({ error: "Child not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Look up sender's display name (parent)
    const { data: { user: parentUser } } = await admin.auth.admin.getUserById(fromUserId);
    const parentName = parentUser?.user_metadata?.full_name
      || (parentUser?.email ? parentUser.email.split("@")[0] : "En förälder");

    // Insert nudge via user client — RLS enforces family + rate limit + quiet hours
    const { data: nudge, error: insertErr } = await userClient.from("nudges").insert({
      from_user_id: fromUserId,
      to_child_id: childId,
      family_id: child.family_id,
      message,
      tone,
    }).select().single();

    if (insertErr) {
      const msg = insertErr.message?.toLowerCase() || "";
      // RLS violation — most likely rate limit or quiet hours
      if (insertErr.code === "42501" || msg.includes("row-level security") || msg.includes("violates")) {
        return new Response(JSON.stringify({
          error: "rate_limit_or_quiet_hours",
          message: "Du har nått dagens gräns för petningar (max 2/barn) eller så är det utanför 07–21.",
        }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      console.error("insert nudge error", insertErr);
      return new Response(JSON.stringify({ error: insertErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Find the child's user account(s)
    const { data: childRoles } = await admin.from("user_roles").select("user_id").eq("child_id", childId).eq("role", "child");
    const targetUserIds = (childRoles ?? []).map((r: { user_id: string }) => r.user_id);

    let delivered = false;
    if (targetUserIds.length > 0) {
      const { data: vapidPub } = await admin.from("app_config").select("value").eq("key", "vapid_public_key").single();
      const { data: vapidPriv } = await admin.from("app_config").select("value").eq("key", "vapid_private_key").single();

      if (vapidPub && vapidPriv) {
        const { data: subs } = await admin.from("push_subscriptions").select("*").in("user_id", targetUserIds);
        const payload = JSON.stringify({
          title: `🫵 ${parentName} petar dig`,
          body: message,
          tag: `nudge-${nudge.id}`,
          url: "/",
        });

        for (const sub of subs ?? []) {
          const ok = await sendPush(sub.endpoint, sub.p256dh, sub.auth_key, vapidPub.value, vapidPriv.value, payload);
          if (ok) delivered = true;
          else await admin.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }

    if (delivered) {
      await admin.from("nudges").update({ delivered: true }).eq("id", nudge.id);
    }

    return new Response(JSON.stringify({ ok: true, delivered, nudge_id: nudge.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("nudge-child error", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

function defaultMessage(tone: string): string {
  switch (tone) {
    case "snall": return "Hej älskling, kom ihåg att göra läxan idag 💚";
    case "peppig": return "Du fixar det här! 5 min så är du i mål 🔥";
    case "bestamd": return "Dags att börja med läxan nu, tack!";
    default: return "Glöm inte läxan idag 📚";
  }
}
