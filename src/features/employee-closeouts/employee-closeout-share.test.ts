import { describe, expect, it } from "vitest";
import { buildEmployeeShareCaption } from "./employee-closeout-share";

describe("buildEmployeeShareCaption", () => {
  it("includes sales, outflow, and net amounts for Arabic WhatsApp text", () => {
    const caption = buildEmployeeShareCaption(
      "ar",
      "مطعم الشامي",
      "أحمد",
      "2026-06-09",
      "2026-06-09",
      { sales: 1500, expense: 325, net: 1175 },
    );

    expect(caption).toContain("تقفيلتي");
    expect(caption).toContain("1,500 ر.س");
    expect(caption).toContain("325 ر.س");
    expect(caption).toContain("1,175 ر.س");
    expect(caption).toContain("الداخل:");
    expect(caption).toContain("الخارج:");
    expect(caption).toContain("الناتج:");
  });

  it("includes amounts for English WhatsApp text", () => {
    const caption = buildEmployeeShareCaption(
      "en",
      "Shami Restaurant",
      "Ahmad",
      "Jun 9, 2026",
      "2026-06-09",
      { sales: 900, expense: 100, net: 800 },
    );

    expect(caption).toContain("My closeout");
    expect(caption).toContain("900 SAR");
    expect(caption).toContain("100 SAR");
    expect(caption).toContain("800 SAR");
  });
});
