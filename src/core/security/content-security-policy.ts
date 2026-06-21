export type ContentSecurityPolicyOptions = {
  nonce?: string;
  isDevelopment?: boolean;
  strictNonce?: boolean;
};

export function isStrictCspNonceEnabled(): boolean {
  return process.env.CSP_STRICT_NONCE === "true";
}

/**
 * Build CSP header value for HTML responses.
 * Default (production-safe): legacy inline scripts for Next.js compatibility.
 * Opt-in strict mode: CSP_STRICT_NONCE=true + per-request nonce + strict-dynamic.
 */
export function buildContentSecurityPolicy({
  nonce = "",
  isDevelopment = process.env.NODE_ENV === "development",
  strictNonce = isStrictCspNonceEnabled(),
}: ContentSecurityPolicyOptions = {}): string {
  const scriptSrc = strictNonce
    ? [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDevelopment ? ["'unsafe-eval'"] : []),
    ]
    : [
      "'self'",
      "'unsafe-inline'",
      ...(isDevelopment ? ["'unsafe-eval'"] : []),
    ];

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

export function createContentSecurityPolicyNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

export function normalizeCspHeaderValue(value: string): string {
  return value.replace(/\s{2,}/g, " ").trim();
}
