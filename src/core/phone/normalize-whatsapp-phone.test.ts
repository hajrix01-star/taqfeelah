import { describe, expect, it } from "vitest";
import { normalizeWhatsAppPhone } from "@/core/phone/normalize-whatsapp-phone";

describe("normalizeWhatsAppPhone", () => {
  it("normalizes local Saudi mobile for wa.me", () => {
    expect(normalizeWhatsAppPhone("0501234567")).toBe("966501234567");
  });

  it("normalizes national-only Saudi mobile for wa.me", () => {
    expect(normalizeWhatsAppPhone("501234567")).toBe("966501234567");
  });

  it("strips plus from E.164 input", () => {
    expect(normalizeWhatsAppPhone("+966501234567")).toBe("966501234567");
  });

  it("normalizes international 00 prefix for wa.me", () => {
    expect(normalizeWhatsAppPhone("00966501234567")).toBe("966501234567");
  });
});
