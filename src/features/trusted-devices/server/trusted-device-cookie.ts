import { createHmac, timingSafeEqual } from "node:crypto";
import { readEnv } from "@/core/config/env";

export const TRUSTED_DEVICE_COOKIE_NAME = "taqfeelah_trusted_device";
const TRUSTED_DEVICE_TTL_SECONDS = 60 * 60 * 24 * 90;

export type TrustedDeviceCookieClaims = {
  userId: string;
  deviceId: string;
  secret: string;
  iat: number;
  exp: number;
};

function getTrustedDeviceSecret(): string {
  const env = readEnv();
  const secret = env.AUTH_SESSION_SECRET;
  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET is required for trusted device cookies.");
  }
  return secret;
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", getTrustedDeviceSecret()).update(encodedPayload).digest("base64url");
}

export function createSignedTrustedDeviceCookieValue(
  claims: Omit<TrustedDeviceCookieClaims, "iat" | "exp">,
  ttlSeconds = TRUSTED_DEVICE_TTL_SECONDS,
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: TrustedDeviceCookieClaims = {
    ...claims,
    iat: now,
    exp: now + ttlSeconds,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(encodedPayload);
  return `v1.${encodedPayload}.${signature}`;
}

export function parseTrustedDeviceCookieValue(
  cookieValue: string | undefined | null,
): TrustedDeviceCookieClaims | null {
  if (!cookieValue) return null;
  const parts = cookieValue.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;

  const encodedPayload = parts[1];
  const signature = parts[2];
  const expected = signPayload(encodedPayload);

  try {
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (sigBuffer.length !== expectedBuffer.length) return null;
    if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as TrustedDeviceCookieClaims;
    if (!payload.userId || !payload.deviceId || !payload.secret || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function buildSetTrustedDeviceCookieHeader(
  claims: Omit<TrustedDeviceCookieClaims, "iat" | "exp">,
  options?: { secure?: boolean; ttlSeconds?: number },
): string {
  const value = createSignedTrustedDeviceCookieValue(claims, options?.ttlSeconds);
  const secure = options?.secure ?? process.env.NODE_ENV === "production";
  const maxAge = options?.ttlSeconds ?? TRUSTED_DEVICE_TTL_SECONDS;
  const parts = [
    `${TRUSTED_DEVICE_COOKIE_NAME}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function buildClearTrustedDeviceCookieHeader(options?: { secure?: boolean }): string {
  const secure = options?.secure ?? process.env.NODE_ENV === "production";
  const parts = [
    `${TRUSTED_DEVICE_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}
