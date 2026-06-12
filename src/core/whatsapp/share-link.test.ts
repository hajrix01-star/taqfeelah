import { describe, expect, it } from "vitest";
import { buildWhatsAppShareUrl } from "@/core/whatsapp/share-link";

describe("buildWhatsAppShareUrl", () => {
  it("builds wa.me link with phone and encoded text", () => {
    const url = buildWhatsAppShareUrl("مرحبًا", "0501234567");
    expect(url).toBe(`https://wa.me/966501234567?text=${encodeURIComponent("مرحبًا")}`);
  });

  it("builds generic wa.me link without phone", () => {
    const url = buildWhatsAppShareUrl("hello");
    expect(url).toBe(`https://wa.me/?text=${encodeURIComponent("hello")}`);
  });
});
