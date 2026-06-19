import { describe, expect, it } from "vitest";
import {
  isPublicSignupAvailable,
  isPublicSignupClientEnabled,
  isPublicSignupEnabled,
} from "@/core/config/public-signup-mode";

describe("public-signup-mode", () => {
  it("requires server flag and email delivery", () => {
    expect(
      isPublicSignupAvailable({
        AUTH_PUBLIC_SIGNUP_ENABLED: "true",
        AUTH_EMAIL_FROM: "noreply@taqfeelah.com",
        RESEND_API_KEY: "re_test",
      }),
    ).toBe(true);

    expect(
      isPublicSignupAvailable({
        AUTH_PUBLIC_SIGNUP_ENABLED: "true",
      }),
    ).toBe(false);
  });

  it("reads client flag independently", () => {
    expect(isPublicSignupEnabled({ AUTH_PUBLIC_SIGNUP_ENABLED: "true" })).toBe(true);
    expect(isPublicSignupClientEnabled({ NEXT_PUBLIC_PUBLIC_SIGNUP_ENABLED: "true" })).toBe(true);
  });
});
