import { describe, expect, it } from "vitest";
import {
  buildContentSecurityPolicy,
  createContentSecurityPolicyNonce,
  normalizeCspHeaderValue,
} from "./content-security-policy";

describe("buildContentSecurityPolicy", () => {
  it("includes nonce and strict-dynamic in production", () => {
    const policy = buildContentSecurityPolicy({
      nonce: "abc123",
      isDevelopment: false,
    });

    expect(policy).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(policy).not.toContain("unsafe-eval");
    expect(policy).toContain("connect-src 'self'");
  });

  it("allows unsafe-eval in development", () => {
    const policy = buildContentSecurityPolicy({
      nonce: "dev-nonce",
      isDevelopment: true,
    });

    expect(policy).toContain("'unsafe-eval'");
  });
});

describe("createContentSecurityPolicyNonce", () => {
  it("returns a non-empty base64 string", () => {
    const nonce = createContentSecurityPolicyNonce();
    expect(nonce.length).toBeGreaterThan(8);
  });
});

describe("normalizeCspHeaderValue", () => {
  it("collapses whitespace", () => {
    expect(normalizeCspHeaderValue("default-src  'self';   script-src 'self'")).toBe(
      "default-src 'self'; script-src 'self'",
    );
  });
});
