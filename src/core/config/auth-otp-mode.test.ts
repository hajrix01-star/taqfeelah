import { afterEach, describe, expect, it, vi } from "vitest";
import { isAuthOtpEnabled } from "./auth-otp-mode";

describe("isAuthOtpEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is false by default", () => {
    expect(isAuthOtpEnabled()).toBe(false);
  });

  it("is true only when AUTH_OTP_ENABLED=true", () => {
    vi.stubEnv("AUTH_OTP_ENABLED", "true");
    expect(isAuthOtpEnabled()).toBe(true);
  });
});
