import { describe, expect, it } from "vitest";
import { buildSupportWhatsAppUrl, resolveSupportWhatsAppNumber } from "./marketing-support";

describe("marketing support", () => {
  it("falls back to the default whatsapp number", () => {
    expect(resolveSupportWhatsAppNumber({})).toBe("966501234567");
  });

  it("normalizes configured whatsapp number", () => {
    expect(
      resolveSupportWhatsAppNumber({ NEXT_PUBLIC_SUPPORT_WHATSAPP: "+966 50 999 8888" }),
    ).toBe("966509998888");
  });

  it("normalizes saudi local whatsapp number", () => {
    expect(
      resolveSupportWhatsAppNumber({ NEXT_PUBLIC_SUPPORT_WHATSAPP: "0533507223" }),
    ).toBe("966533507223");
  });

  it("builds a whatsapp contact url", () => {
    expect(buildSupportWhatsAppUrl("مرحبًا")).toContain("https://wa.me/");
    expect(buildSupportWhatsAppUrl("مرحبًا")).toContain(encodeURIComponent("مرحبًا"));
  });
});
