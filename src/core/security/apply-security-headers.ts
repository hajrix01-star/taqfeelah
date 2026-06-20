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

/** Apply nonce-based CSP and baseline security headers to a middleware response. */
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

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = upstreamResponse ?? NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const secured = new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });

  for (const header of SHARED_SECURITY_HEADERS) {
    secured.headers.set(header.key, header.value);
  }

  if (shouldAttachStrictTransportSecurity()) {
    secured.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  secured.headers.set("Content-Security-Policy", csp);
  secured.headers.set("x-nonce", nonce);

  // Preserve Set-Cookie and other response-specific headers from upstream handlers.
  response.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey === "content-security-policy") return;
    if (lowerKey === "x-nonce") return;
    if (SHARED_SECURITY_HEADERS.some((header) => header.key.toLowerCase() === lowerKey)) {
      return;
    }
    if (lowerKey === "strict-transport-security") return;
    secured.headers.set(key, value);
  });

  return secured;
}
