export type ContentSecurityPolicyOptions = {
  nonce: string;
  isDevelopment?: boolean;
};

/**
 * Build CSP header value for HTML responses.
 * Uses per-request nonce + strict-dynamic for Next.js script chunks.
 */
export function buildContentSecurityPolicy({
  nonce,
  isDevelopment = process.env.NODE_ENV === "development",
}: ContentSecurityPolicyOptions): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
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
