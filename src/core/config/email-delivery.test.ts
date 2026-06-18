import { describe, expect, it } from "vitest";
import { isEmailDeliveryConfigured } from "@/core/config/email-delivery";

describe("email delivery config", () => {
  it("requires AUTH_EMAIL_FROM and a provider", () => {
    expect(isEmailDeliveryConfigured({})).toBe(false);
    expect(isEmailDeliveryConfigured({ AUTH_EMAIL_FROM: "noreply@taqfeelah.app" })).toBe(false);
    expect(isEmailDeliveryConfigured({
      AUTH_EMAIL_FROM: "noreply@taqfeelah.app",
      RESEND_API_KEY: "re_test",
    })).toBe(true);
    expect(isEmailDeliveryConfigured({
      AUTH_EMAIL_FROM: "noreply@taqfeelah.app",
      SMTP_HOST: "smtp.example.com",
    })).toBe(true);
  });
});
