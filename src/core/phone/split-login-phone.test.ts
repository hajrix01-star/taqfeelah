import { describe, expect, it } from "vitest";
import { composeLoginPhone, formatLoginPhoneForDisplay, sanitizeNationalPhoneInput, splitLoginPhone } from "@/core/phone/split-login-phone";

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

  it("sanitizes national input from local 05 prefix", () => {
    expect(sanitizeNationalPhoneInput("05")).toBe("5");
    expect(sanitizeNationalPhoneInput("0552210049")).toBe("552210049");
  });

  it("sanitizes pasted international numbers", () => {
    expect(sanitizeNationalPhoneInput("966552210049")).toBe("552210049");
    expect(sanitizeNationalPhoneInput("+966552210049")).toBe("552210049");
  });

  it("formats for display", () => {
    expect(formatLoginPhoneForDisplay("+966501234567")).toBe("+966 501234567");
  });
});
