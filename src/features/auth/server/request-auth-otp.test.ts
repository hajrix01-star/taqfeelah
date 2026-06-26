import { describe, expect, it } from "vitest";
import { requestAuthOtp } from "./request-auth-otp";

describe("requestAuthOtp", () => {
  it("rejects OTP requests until a delivery provider is configured", async () => {
    await expect(requestAuthOtp({
      channel: "whatsapp",
      destination: "+966500000000",
      purpose: "owner_login",
    })).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
      status: 503,
    });
  });
});
