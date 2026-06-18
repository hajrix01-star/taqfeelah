import { describe, expect, it } from "vitest";
import {
  isPasswordResetAvailable,
  isPasswordResetEnabled,
} from "@/core/config/password-reset-mode";

describe("password reset mode", () => {
  it("is disabled unless AUTH_PASSWORD_RESET_ENABLED=true", () => {
    expect(isPasswordResetEnabled({ AUTH_PASSWORD_RESET_ENABLED: undefined })).toBe(false);
    expect(isPasswordResetEnabled({ AUTH_PASSWORD_RESET_ENABLED: "false" })).toBe(false);
    expect(isPasswordResetEnabled({ AUTH_PASSWORD_RESET_ENABLED: "true" })).toBe(true);
  });

  it("is available only when enabled and email delivery is configured", () => {
    expect(isPasswordResetAvailable({
      AUTH_PASSWORD_RESET_ENABLED: "true",
    })).toBe(false);
    expect(isPasswordResetAvailable({
      AUTH_PASSWORD_RESET_ENABLED: "true",
      AUTH_EMAIL_FROM: "noreply@taqfeelah.app",
      RESEND_API_KEY: "re_test",
    })).toBe(true);
  });
});
