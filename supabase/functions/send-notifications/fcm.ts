// Firebase Cloud Messaging HTTP v1 sender for native iOS/Android devices.
// Requires the FIREBASE_SERVICE_ACCOUNT secret (the full service account JSON).

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
}

let cachedAccount: ServiceAccount | null = null;
let cachedToken: { token: string; expiresAt: number } | null = null;

function getServiceAccount(): ServiceAccount | null {
  if (cachedAccount) return cachedAccount;
  const raw = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ServiceAccount;
    if (!parsed.client_email || !parsed.private_key || !parsed.project_id) return null;
    cachedAccount = parsed;
    return cachedAccount;
  } catch {
    console.error("FIREBASE_SERVICE_ACCOUNT is not valid JSON");
    return null;
  }
}

function b64url(bytes: Uint8Array | ArrayBuffer): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const b of arr) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function pemToPkcs8(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\\n/g, "")
    .replace(/\s/g, "");
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getAccessToken(account: ServiceAccount): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) return cachedToken.token;

  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const input = `${b64url(new TextEncoder().encode(JSON.stringify(header)))}.${b64url(
    new TextEncoder().encode(JSON.stringify(claims))
  )}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(account.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(input)
  );

  const assertion = `${input}.${b64url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!res.ok) {
    console.error("FCM token exchange failed:", res.status, await res.text());
    return null;
  }

  const json = await res.json();
  cachedToken = { token: json.access_token, expiresAt: now + (json.expires_in ?? 3600) };
  return cachedToken.token;
}

/**
 * Send a notification to a native device token via FCM HTTP v1.
 * Returns false when the token is invalid/unregistered (caller should delete it).
 */
export async function sendFcmNotification(
  deviceToken: string,
  payload: { title: string; body: string; tag?: string; url?: string }
): Promise<boolean> {
  const account = getServiceAccount();
  if (!account) {
    console.warn("FCM not configured – skipping native push");
    return true; // don't delete the row just because the secret is missing
  }

  const accessToken = await getAccessToken(account);
  if (!accessToken) return true;

  const message = {
    message: {
      token: deviceToken,
      notification: { title: payload.title, body: payload.body },
      data: { url: payload.url ?? "/", tag: payload.tag ?? "default" },
      apns: {
        payload: { aps: { sound: "default", badge: 1 } },
      },
      android: {
        priority: "HIGH",
        notification: { sound: "default", channel_id: "laxhjalp-reminders" },
      },
    },
  };

  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    }
  );

  if (res.ok) return true;

  const text = await res.text();
  if (res.status === 404 || text.includes("UNREGISTERED") || text.includes("INVALID_ARGUMENT")) {
    console.log("FCM token no longer valid");
    return false;
  }

  console.error(`FCM send failed (${res.status}): ${text}`);
  return true;
}
