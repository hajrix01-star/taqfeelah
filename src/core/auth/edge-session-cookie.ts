const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type EdgeAuthSessionClaims = {
  organizationId: string;
  userId: string;
  role: string;
  iat: number;
  exp: number;
};

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, pair) => {
      const idx = pair.indexOf("=");
      if (idx <= 0) return acc;
      const key = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      if (!key) return acc;
      acc[key] = value;
      return acc;
    }, {});
}

function fromBase64Url(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  const normalized = padded + "=".repeat(padLength);
  return atob(normalized);
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

async function signPayload(encodedPayload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encodedPayload));
  return toBase64Url(new Uint8Array(signature));
}

function parseSessionClaims(encodedPayload: string): EdgeAuthSessionClaims | null {
  try {
    const decoded = JSON.parse(fromBase64Url(encodedPayload)) as EdgeAuthSessionClaims;
    if (
      !decoded ||
      typeof decoded !== "object" ||
      !UUID_RE.test(decoded.organizationId) ||
      !UUID_RE.test(decoded.userId) ||
      typeof decoded.role !== "string" ||
      typeof decoded.iat !== "number" ||
      typeof decoded.exp !== "number"
    ) {
      return null;
    }
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp <= now) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function resolveEdgeAuthSessionFromRequest(
  request: Request,
  cookieName: string,
  secret?: string,
): Promise<EdgeAuthSessionClaims | null> {
  if (!secret || secret.length < 16) return null;
  const cookies = parseCookies(request.headers.get("cookie"));
  const raw = cookies[cookieName];
  if (!raw) return null;

  const [version, encodedPayload, signature] = raw.split(".");
  if (version !== "v1" || !encodedPayload || !signature) return null;

  const expected = await signPayload(encodedPayload, secret);
  if (!timingSafeEqual(signature, expected)) return null;
  return parseSessionClaims(encodedPayload);
}
