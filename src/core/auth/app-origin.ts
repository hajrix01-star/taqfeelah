import { readEnv } from "@/core/config/env";

export function resolveAppPublicOrigin(request?: Request): string {
  const env = readEnv();
  const fromEnv = env.APP_PUBLIC_ORIGIN || env.NEXT_PUBLIC_APP_ORIGIN;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  if (request) {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || "https";
    if (host) return `${proto}://${host}`.replace(/\/$/, "");
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }

  return "https://taqfeelah.com";
}

export function buildInviteUrl(token: string, request?: Request): string {
  const origin = resolveAppPublicOrigin(request);
  return `${origin}/invite/${encodeURIComponent(token)}`;
}

export function buildOwnerLoginUrl(request?: Request): string {
  const origin = resolveAppPublicOrigin(request);
  return `${origin}/app`;
}
