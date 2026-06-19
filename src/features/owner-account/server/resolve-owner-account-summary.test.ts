import { describe, expect, it } from "vitest";
import { isEmailLoginIdentifier } from "@/core/auth/email-login-identifier";
import { formatLoginPhoneForDisplay } from "@/core/phone/split-login-phone";

describe("owner account summary shaping", () => {
  it("detects signup email as login identifier", () => {
    expect(isEmailLoginIdentifier("owner@example.com")).toBe(true);
    expect(isEmailLoginIdentifier("hajri")).toBe(false);
  });

  it("formats login phone for owner account display", () => {
    expect(formatLoginPhoneForDisplay("+966501234567")).toBe("+966 501234567");
  });
});
