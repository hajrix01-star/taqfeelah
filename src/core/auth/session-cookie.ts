import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { MEMBER_ROLES, type MemberRole } from "@/core/auth/roles";

const sessionSchema = z.object({
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(MEMBER_ROLES),
  iat: z.number().int().nonnegative(),
  exp: z.number().int().positive(),
});

export type AuthSessionClaims = z.infer<typeof sessionSchema>;

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

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

export function createSignedAuthSessionCookieValue(
  claims: Omit<AuthSessionClaims, "iat" | "exp"> & { ttlSeconds?: number },
  secret: string,
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AuthSessionClaims = {
    organizationId: claims.organizationId,
    userId: claims.userId,
    role: claims.role as MemberRole,
    iat: now,
    exp: now + (claims.ttlSeconds ?? 60 * 60 * 12),
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, secret);
  return `v1.${encodedPayload}.${signature}`;
}

export function resolveAuthSessionFromRequest(
  request: Request,
  cookieName: string,
  secret?: string,
): AuthSessionClaims | null {
  if (!secret || secret.length < 16) return null;
  const cookies = parseCookies(request.headers.get("cookie"));
  const raw = cookies[cookieName];
  if (!raw) return null;

  const [version, encodedPayload, signature] = raw.split(".");
  if (version !== "v1" || !encodedPayload || !signature) return null;

  const expected = signPayload(encodedPayload, secret);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return null;
  if (!timingSafeEqual(left, right)) return null;

  try {
    const decoded = JSON.parse(fromBase64Url(encodedPayload));
    const parsed = sessionSchema.safeParse(decoded);
    if (!parsed.success) return null;
    const now = Math.floor(Date.now() / 1000);
    if (parsed.data.exp <= now) return null;
    return parsed.data;
  } catch {
    return null;
  }
}
