import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Module-level VAPID cache — survives across warm invocations to avoid hammering app_config
let cachedVapid: { publicKey: string; privateKey: string } | null = null;
async function getVapidKeys(supabase: ReturnType<typeof createClient>) {
  if (cachedVapid) return cachedVapid;
  const { data: pub } = await supabase.from("app_config").select("value").eq("key", "vapid_public_key").single();
  const { data: priv } = await supabase.from("app_config").select("value").eq("key", "vapid_private_key").single();
  if (!pub || !priv) return null;
  cachedVapid = { publicKey: pub.value as string, privateKey: priv.value as string };
  return cachedVapid;
}

// ============ Web Push implementation using Web Crypto API ============

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function concatBuffers(...buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const buffer of buffers) {
    result.set(buffer, offset);
    offset += buffer.length;
  }
  return result;
}

async function createVapidJwt(
  endpoint: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ authorization: string; cryptoKey: string }> {
  const audience = new URL(endpoint).origin;
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60;

  // Import private key from JWK d parameter
  const publicKeyBytes = base64UrlDecode(vapidPublicKey);
  const x = base64UrlEncode(publicKeyBytes.slice(1, 33));
  const y = base64UrlEncode(publicKeyBytes.slice(33, 65));

  const jwk = {
    kty: "EC",
    crv: "P-256",
    x,
    y,
    d: vapidPrivateKey,
  };

  const privateKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: expiration,
    sub: "mailto:notifications@laxhjalp.app",
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const input = `${headerB64}.${payloadB64}`;

  const signatureBuffer = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    new TextEncoder().encode(input)
  );

  const signatureB64 = base64UrlEncode(signatureBuffer);
  const jwt = `${input}.${signatureB64}`;

  return {
    authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
    cryptoKey: vapidPublicKey,
  };
}

async function encryptPayload(
  payload: string,
  subscriberPublicKey: string,
  subscriberAuth: string
): Promise<{ body: Uint8Array; headers: Record<string, string> }> {
  const payloadBytes = new TextEncoder().encode(payload);

  // Generate ephemeral ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", localKeyPair.publicKey)
  );

  // Import subscriber's public key
  const subscriberKeyBytes = base64UrlDecode(subscriberPublicKey);
  const subscriberKey = await crypto.subtle.importKey(
    "raw",
    subscriberKeyBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // ECDH shared secret
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: subscriberKey },
    localKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);

  // Auth secret
  const authBytes = base64UrlDecode(subscriberAuth);

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF for IKM
  const authInfo = concatBuffers(
    new TextEncoder().encode("WebPush: info\0"),
    subscriberKeyBytes,
    localPublicKeyRaw
  );

  const ikmKey = await crypto.subtle.importKey(
    "raw",
    authBytes,
    { name: "HKDF" },
    false,
    ["deriveBits"]
  );

  // This is not standard HKDF usage; we need to do HKDF(auth, sharedSecret, authInfo)
  // Step 1: HKDF-Extract with auth as salt and sharedSecret as IKM
  const prkKey = await crypto.subtle.importKey(
    "raw",
    sharedSecret,
    { name: "HKDF" },
    false,
    ["deriveBits"]
  );

  const ikm = new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: "HKDF",
        hash: "SHA-256",
        salt: authBytes,
        info: authInfo,
      },
      prkKey,
      256
    )
  );

  // Content encryption key
  const cekInfo = concatBuffers(
    new TextEncoder().encode("Content-Encoding: aes128gcm\0")
  );

  const ikmKeyForCek = await crypto.subtle.importKey(
    "raw",
    ikm,
    { name: "HKDF" },
    false,
    ["deriveBits"]
  );

  const cekBits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt,
      info: cekInfo,
    },
    ikmKeyForCek,
    128
  );

  // Nonce
  const nonceInfo = concatBuffers(
    new TextEncoder().encode("Content-Encoding: nonce\0")
  );

  const nonceBits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt,
      info: nonceInfo,
    },
    ikmKeyForCek,
    96
  );
  const nonce = new Uint8Array(nonceBits);

  // Encrypt with AES-128-GCM
  const cek = await crypto.subtle.importKey(
    "raw",
    cekBits,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  // Add padding delimiter (2 bytes: 0x02 for last record)
  const paddedPayload = concatBuffers(payloadBytes, new Uint8Array([2]));

  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce },
      cek,
      paddedPayload
    )
  );

  // Build aes128gcm body:
  // salt (16) + rs (4) + idlen (1) + keyid (65) + encrypted
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096);

  const body = concatBuffers(
    salt,
    rs,
    new Uint8Array([localPublicKeyRaw.length]),
    localPublicKeyRaw,
    encrypted
  );

  return {
    body,
    headers: {
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
    },
  };
}

async function sendPushNotification(
  endpoint: string,
  p256dh: string,
  authKey: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  payload: string
): Promise<boolean> {
  try {
    const { authorization } = await createVapidJwt(endpoint, vapidPublicKey, vapidPrivateKey);
    const { body, headers: encHeaders } = await encryptPayload(payload, p256dh, authKey);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        ...encHeaders,
        Authorization: authorization,
        TTL: "86400",
      },
      body: body,
    });

    if (response.status === 410 || response.status === 404) {
      console.log(`Subscription expired: ${endpoint}`);
      return false;
    }

    if (!response.ok) {
      const text = await response.text();
      console.error(`Push failed (${response.status}): ${text}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Push error for ${endpoint}:`, error);
    return false;
  }
}

// ============ Main handler ============

function getUserTimeInfo(timezone: string): { hours: number; minutes: number; dayOfWeek: number; dateStr: string } {
  const now = new Date();
  
  const timeParts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  const dayParts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).formatToParts(now);

  const dateParts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const hours = parseInt(timeParts.find((p) => p.type === "hour")?.value || "0");
  const minutes = parseInt(timeParts.find((p) => p.type === "minute")?.value || "0");
  const weekday = dayParts.find((p) => p.type === "weekday")?.value || "";
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  return {
    hours,
    minutes,
    dayOfWeek: dayMap[weekday] || 0,
    dateStr: dateParts,
  };
}

async function checkUnfinishedTasks(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  todayStr: string
): Promise<boolean> {
  const { data: roles } = await supabase
    .from("user_roles")
    .select("family_id, child_id")
    .eq("user_id", userId)
    .limit(1);

  if (!roles?.length) return false;

  let childIds: string[] = [];
  if (roles[0].child_id) {
    childIds = [roles[0].child_id];
  } else if (roles[0].family_id) {
    const { data: children } = await supabase
      .from("children")
      .select("id")
      .eq("family_id", roles[0].family_id);
    childIds = children?.map((c: { id: string }) => c.id) || [];
  }

  if (!childIds.length) return false;

  // Check adhoc tasks
  const { count: adhocCount } = await supabase
    .from("adhoc_tasks")
    .select("id", { count: "exact", head: true })
    .in("child_id", childIds)
    .eq("task_date", todayStr)
    .eq("completed", false);

  if ((adhocCount || 0) > 0) return true;

  // Check study tasks
  const { data: hwData } = await supabase
    .from("homework")
    .select("id")
    .in("child_id", childIds);

  const hwIds = hwData?.map((h: { id: string }) => h.id) || [];
  if (!hwIds.length) return false;

  const { data: tasks } = await supabase
    .from("study_tasks")
    .select("id, snoozed_until")
    .in("homework_id", hwIds)
    .eq("task_date", todayStr)
    .eq("completed", false);

  return tasks?.some((t: { snoozed_until: string | null }) => 
    !t.snoozed_until || t.snoozed_until <= todayStr
  ) || false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Require either a shared cron secret or the service role key as bearer
    const cronSecret = Deno.env.get("CRON_SECRET");
    const authHeader = req.headers.get("authorization") || "";
    const providedSecret = req.headers.get("x-cron-secret") || "";
    const bearer = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : "";
    const isAuthorized =
      (cronSecret && providedSecret && providedSecret === cronSecret) ||
      (bearer && bearer === serviceRoleKey);

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get VAPID keys (module-cached)
    const vapid = await getVapidKeys(supabase);
    if (!vapid) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured. Call get-push-config first." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const vapidPublic = { value: vapid.publicKey };
    const vapidPrivate = { value: vapid.privateKey };


    // Get all active subscriptions
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No subscriptions" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sentCount = 0;

    for (const sub of subscriptions) {
      const { hours, minutes, dayOfWeek, dateStr: userToday } = getUserTimeInfo(sub.timezone);

      try {
        // Type 1: 14:30 weekdays - Log new homework
        if (
          hours === 14 &&
          minutes === 30 &&
          dayOfWeek >= 1 &&
          dayOfWeek <= 5 &&
          sub.notify_new_homework &&
          sub.last_homework_notify !== userToday
        ) {
          const payload = JSON.stringify({
            title: "📚 Nya läxor idag?",
            body: "Har du fått några nya läxor idag? Logga dem nu så glömmer du inte!",
            tag: "new-homework",
            url: "/add",
          });

          const success = await sendPushNotification(
            sub.endpoint, sub.p256dh, sub.auth_key,
            vapidPublic.value, vapidPrivate.value, payload
          );

          if (success) {
            await supabase
              .from("push_subscriptions")
              .update({ last_homework_notify: userToday })
              .eq("id", sub.id);
            sentCount++;
          } else {
            // Remove invalid subscription
            await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }

        // Type 2: 15:30 - Unfinished tasks
        if (
          hours === 15 &&
          minutes === 30 &&
          sub.notify_unfinished &&
          sub.last_unfinished_notify !== userToday
        ) {
          const hasUnfinished = await checkUnfinishedTasks(supabase, sub.user_id, userToday);
          if (hasUnfinished) {
            const payload = JSON.stringify({
              title: "✏️ Du har uppgifter kvar!",
              body: "Du har fortfarande ogjorda uppgifter idag. Kör på, du klarar det!",
              tag: "unfinished-tasks",
              url: "/",
            });

            const success = await sendPushNotification(
              sub.endpoint, sub.p256dh, sub.auth_key,
              vapidPublic.value, vapidPrivate.value, payload
            );

            if (success) {
              await supabase
                .from("push_subscriptions")
                .update({ last_unfinished_notify: userToday })
                .eq("id", sub.id);
              sentCount++;
            } else {
              await supabase.from("push_subscriptions").delete().eq("id", sub.id);
            }
          }
        }

        // Type 3: 18:30 - Final reminder
        if (
          hours === 18 &&
          minutes === 30 &&
          sub.notify_reminder &&
          sub.last_reminder_notify !== userToday
        ) {
          const hasUnfinished = await checkUnfinishedTasks(supabase, sub.user_id, userToday);
          if (hasUnfinished) {
            const payload = JSON.stringify({
              title: "⏰ Sista påminnelsen!",
              body: "Kvällen närmar sig - glöm inte att göra klart dagens uppgifter!",
              tag: "reminder-tasks",
              url: "/",
            });

            const success = await sendPushNotification(
              sub.endpoint, sub.p256dh, sub.auth_key,
              vapidPublic.value, vapidPrivate.value, payload
            );

            if (success) {
              await supabase
                .from("push_subscriptions")
                .update({ last_reminder_notify: userToday })
                .eq("id", sub.id);
              sentCount++;
            } else {
              await supabase.from("push_subscriptions").delete().eq("id", sub.id);
            }
          }
        }
      } catch (subError) {
        console.error(`Error processing subscription ${sub.id}:`, subError);
      }
    }

    return new Response(
      JSON.stringify({ sent: sentCount, total: subscriptions.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
