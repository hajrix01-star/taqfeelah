import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildSupportWhatsAppUrl,
  LEGACY_NON_PRODUCTION_SUPPORT_WHATSAPP,
  PRODUCTION_SUPPORT_WHATSAPP,
  resolveSupportWhatsAppNumber,
} from "./marketing-support";

describe("marketing support", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back to the production support whatsapp number", () => {
    expect(resolveSupportWhatsAppNumber()).toBe(PRODUCTION_SUPPORT_WHATSAPP);
    expect(resolveSupportWhatsAppNumber({})).toBe(PRODUCTION_SUPPORT_WHATSAPP);
  });

  it("reads configured whatsapp via direct process.env for client inlining", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPPORT_WHATSAPP", "0533507223");
    expect(resolveSupportWhatsAppNumber()).toBe("966533507223");
  });

  it("normalizes configured whatsapp number from custom env", () => {
    expect(
      resolveSupportWhatsAppNumber({ NEXT_PUBLIC_SUPPORT_WHATSAPP: "+966 50 999 8888" }),
    ).toBe("966509998888");
  });

  it("normalizes saudi local whatsapp number", () => {
    expect(
      resolveSupportWhatsAppNumber({ NEXT_PUBLIC_SUPPORT_WHATSAPP: "0533507223" }),
    ).toBe("966533507223");
  });

  it("builds a whatsapp contact url with the resolved phone", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPPORT_WHATSAPP", "0533507223");
    const url = buildSupportWhatsAppUrl("مرحبًا");
    expect(url).toContain(`https://wa.me/${PRODUCTION_SUPPORT_WHATSAPP}`);
    expect(url).toContain(encodeURIComponent("مرحبًا"));
    expect(url).not.toContain(LEGACY_NON_PRODUCTION_SUPPORT_WHATSAPP);
  });
});
