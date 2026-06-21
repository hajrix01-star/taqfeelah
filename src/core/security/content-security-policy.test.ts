import { describe, expect, it, vi } from "vitest";
import {
  buildContentSecurityPolicy,
  createContentSecurityPolicyNonce,
  normalizeCspHeaderValue,
} from "./content-security-policy";

describe("buildContentSecurityPolicy", () => {
  it("uses legacy unsafe-inline scripts by default in production", () => {
    const policy = buildContentSecurityPolicy({
      isDevelopment: false,
      strictNonce: false,
    });

    expect(policy).toContain("script-src 'self' 'unsafe-inline'");
    expect(policy).not.toContain("strict-dynamic");
    expect(policy).not.toContain("unsafe-eval");
  });

  it("includes nonce and strict-dynamic when strict mode is enabled", () => {
    const policy = buildContentSecurityPolicy({
      nonce: "abc123",
      isDevelopment: false,
      strictNonce: true,
    });

    expect(policy).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(policy).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(policy).not.toMatch(/script-src[^;]*unsafe-eval/);
  });

  it("allows unsafe-eval in development", () => {
    const policy = buildContentSecurityPolicy({
      nonce: "dev-nonce",
      isDevelopment: true,
      strictNonce: true,
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
