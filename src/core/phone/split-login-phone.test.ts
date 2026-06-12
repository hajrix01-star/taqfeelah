import { describe, expect, it } from "vitest";
import { composeLoginPhone, formatLoginPhoneForDisplay, splitLoginPhone } from "@/core/phone/split-login-phone";

describe("splitLoginPhone", () => {
  it("splits Saudi E.164 numbers", () => {
    expect(splitLoginPhone("+966501234567")).toEqual({
      dialCode: "+966",
      nationalNumber: "501234567",
    });
  });

  it("composes dial code and national number", () => {
    expect(composeLoginPhone("+966", "501234567")).toBe("+966501234567");
    expect(composeLoginPhone("+966", "0501234567")).toBe("+966501234567");
  });

  it("formats for display", () => {
    expect(formatLoginPhoneForDisplay("+966501234567")).toBe("+966 501234567");
  });
});
