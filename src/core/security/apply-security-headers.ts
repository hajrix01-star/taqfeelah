import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  buildContentSecurityPolicy,
  createContentSecurityPolicyNonce,
  isStrictCspNonceEnabled,
  normalizeCspHeaderValue,
} from "./content-security-policy";

const SHARED_SECURITY_HEADERS: Array<{ key: string; value: string }> = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), payment=()",
  },
];

function shouldAttachStrictTransportSecurity(): boolean {
  return process.env.NODE_ENV === "production";
}

function applySharedHeaders(response: NextResponse, csp: string, nonce?: string): NextResponse {
  for (const header of SHARED_SECURITY_HEADERS) {
    response.headers.set(header.key, header.value);
  }

  if (shouldAttachStrictTransportSecurity()) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  response.headers.set("Content-Security-Policy", csp);
  if (nonce) {
    response.headers.set("x-nonce", nonce);
  }
  return response;
}

/** Apply CSP and baseline security headers to a middleware response. */
export function applySecurityHeaders(
  request: NextRequest,
  upstreamResponse?: NextResponse,
): NextResponse {
  const strictNonce = isStrictCspNonceEnabled();
  const nonce = strictNonce ? createContentSecurityPolicyNonce() : "";
  const csp = normalizeCspHeaderValue(
    buildContentSecurityPolicy({
      nonce,
      isDevelopment: process.env.NODE_ENV === "development",
      strictNonce,
    }),
  );

  if (upstreamResponse) {
    return applySharedHeaders(upstreamResponse, csp, strictNonce ? nonce : undefined);
  }

  const requestHeaders = new Headers(request.headers);
  if (strictNonce) {
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", csp);
  }

  const response = NextResponse.next(
    strictNonce
      ? { request: { headers: requestHeaders } }
      : undefined,
  );

  return applySharedHeaders(response, csp, strictNonce ? nonce : undefined);
}
