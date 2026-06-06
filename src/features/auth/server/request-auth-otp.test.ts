import { describe, expect, it } from "vitest";
import { requestAuthOtp } from "./request-auth-otp";

describe("requestAuthOtp", () => {
  it("returns stub response without sending OTP", async () => {
    const result = await requestAuthOtp({
      channel: "whatsapp",
      destination: "+966500000000",
      purpose: "owner_login",
    });
    expect(result.accepted).toBe(true);
    expect(result.deliveryStatus).toBe("stub_not_configured");
  });
});
