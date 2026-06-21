import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  buildContentSecurityPolicy,
  createContentSecurityPolicyNonce,
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

function applySharedHeaders(response: NextResponse, csp: string, nonce: string): NextResponse {
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
  response.headers.set("x-nonce", nonce);
  return response;
}

/**
 * Apply nonce-based CSP and baseline security headers to a middleware response.
 * Next.js reads CSP from *request* headers to inject script nonces during SSR.
 */
export function applySecurityHeaders(
  request: NextRequest,
  upstreamResponse?: NextResponse,
): NextResponse {
  const nonce = createContentSecurityPolicyNonce();
  const csp = normalizeCspHeaderValue(
    buildContentSecurityPolicy({
      nonce,
      isDevelopment: process.env.NODE_ENV === "development",
    }),
  );

  if (upstreamResponse) {
    return applySharedHeaders(upstreamResponse, csp, nonce);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return applySharedHeaders(response, csp, nonce);
}
