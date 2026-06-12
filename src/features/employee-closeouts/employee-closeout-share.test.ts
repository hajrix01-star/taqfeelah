import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildEmployeeShareCaption, shareEmployeeCloseoutImage } from "./employee-closeout-share";

function makePngFile() {
  return new File([new Uint8Array([137, 80, 78, 71])], "closeout.png", { type: "image/png" });
}

describe("shareEmployeeCloseoutImage", () => {
  const openSpy = vi.fn();

  beforeEach(() => {
    openSpy.mockReset();
    vi.stubGlobal("window", { open: openSpy });
    vi.stubGlobal("navigator", {
      share: vi.fn().mockResolvedValue(undefined),
      canShare: vi.fn().mockReturnValue(true),
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        write: vi.fn().mockResolvedValue(undefined),
      },
    });
    vi.stubGlobal("ClipboardItem", class ClipboardItem {
      constructor(public items: Record<string, Blob>) {}
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shares image and caption together through native share", async () => {
    const file = makePngFile();
    const caption = "تقفيلتي لمحل ARZ بواسطة الموظف أحمد";

    const result = await shareEmployeeCloseoutImage({ file, caption, lang: "ar" });

    expect(navigator.share).toHaveBeenCalledWith({
      files: [file],
      text: caption,
      title: "تقفيلتي",
    });
    expect(openSpy).not.toHaveBeenCalled();
    expect(navigator.clipboard.write).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, method: "share", copied: false });
  });
});

describe("buildEmployeeShareCaption", () => {
  it("includes employee name in Arabic WhatsApp text", () => {
    const caption = buildEmployeeShareCaption(
      "ar",
      "مطعم الشامي",
      "أحمد",
      "2026-06-09",
      "2026-06-09",
      { sales: 1500, expense: 325, net: 1175 },
    );

    expect(caption).toContain("بواسطة الموظف أحمد");
  });

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
