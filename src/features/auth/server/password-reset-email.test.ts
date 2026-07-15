import { describe, expect, it } from "vitest";
import {
  buildPasswordResetEmailContent,
  buildPasswordResetUrl,
} from "@/features/auth/server/password-reset-email";

describe("password reset email helpers", () => {
  it("builds owner reset urls under /auth", () => {
    expect(buildPasswordResetUrl("token-123", "owner", undefined)).toBe(
      "https://taqfeelah.com/auth/reset-password?token=token-123",
    );
  });

  it("builds platform admin reset urls under /saas-admin", () => {
    expect(buildPasswordResetUrl("token-456", "platform_admin", undefined)).toBe(
      "https://taqfeelah.com/saas-admin/reset-password?token=token-456",
    );
  });

  it("uses distinct subjects per audience", () => {
    const owner = buildPasswordResetEmailContent("https://example.com/reset", "owner");
    const platform = buildPasswordResetEmailContent("https://example.com/reset", "platform_admin");

    expect(owner.subject).toContain("تقفيلة");
    expect(platform.subject).toContain("لوحة");
    expect(owner.subject).not.toBe(platform.subject);
  });
});
