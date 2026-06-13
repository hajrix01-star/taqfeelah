import { describe, expect, it } from "vitest";
import { isPasswordResetEnabled } from "@/core/config/password-reset-mode";

describe("password reset mode", () => {
  it("is disabled unless AUTH_PASSWORD_RESET_ENABLED=true", () => {
    expect(isPasswordResetEnabled({ AUTH_PASSWORD_RESET_ENABLED: undefined })).toBe(false);
    expect(isPasswordResetEnabled({ AUTH_PASSWORD_RESET_ENABLED: "false" })).toBe(false);
    expect(isPasswordResetEnabled({ AUTH_PASSWORD_RESET_ENABLED: "true" })).toBe(true);
  });
});
