import { describe, expect, it } from "vitest";
import {
  buildSignupVerificationUrl,
  hashSignupVerificationToken,
  normalizeSignupEmail,
} from "@/features/signup/server/signup-token";

describe("signup-token", () => {
  it("normalizes email", () => {
    expect(normalizeSignupEmail("  Owner@Example.COM ")).toBe("owner@example.com");
  });

  it("hashes tokens deterministically", () => {
    const hash = hashSignupVerificationToken("abc123");
    expect(hash).toHaveLength(64);
    expect(hashSignupVerificationToken("abc123")).toBe(hash);
  });

  it("builds verify url", () => {
    expect(buildSignupVerificationUrl("token123")).toContain("/auth/verify-email?token=token123");
  });
});
