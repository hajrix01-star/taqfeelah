import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildEntryAttachmentShareCaption,
  dataUrlToShareFile,
  shareEntryAttachmentImage,
} from "./entry-attachment-share";

function makePngFile() {
  return new File([new Uint8Array([137, 80, 78, 71])], "invoice.png", { type: "image/png" });
}

describe("buildEntryAttachmentShareCaption", () => {
  it("builds Arabic dialect caption with date, weekday, and closeout letter", () => {
    const caption = buildEntryAttachmentShareCaption({
      lang: "ar",
      storeName: "محل الشامي",
      operationLabel: "مشتريات",
      entryDate: "2026-06-13",
      daySequence: 2,
      sameDayCloseoutCount: 2,
    });

    expect(caption).toContain("فاتورة مشتريات");
    expect(caption).toContain("لمحل الشامي");
    expect(caption).toContain("بتاريخ");
    expect(caption).toContain("ويوم");
    expect(caption).toContain("تقفيلة B");
  });

  it("uses operation time when closeout letter is unavailable", () => {
    const caption = buildEntryAttachmentShareCaption({
      lang: "ar",
      storeName: "ARZ",
      operationLabel: "مصروف",
      entryDate: "2026-06-13",
      entryTime: "3:45 م",
      sameDayCloseoutCount: 1,
    });

    expect(caption).toContain("فاتورة مصروف");
    expect(caption).toContain("الساعة 3:45 م");
    expect(caption).not.toContain("تقفيلة");
  });

  it("builds English caption with closeout reference", () => {
    const caption = buildEntryAttachmentShareCaption({
      lang: "en",
      storeName: "Shami",
      operationLabel: "Purchases",
      entryDate: "2026-06-13",
      daySequence: 1,
      sameDayCloseoutCount: 2,
    });

    expect(caption).toContain("Invoice Purchases");
    expect(caption).toContain("for Shami");
    expect(caption).toContain("closeout A");
  });
});

describe("dataUrlToShareFile", () => {
  it("converts a data URL into a File preserving mime type", async () => {
    const dataUrl = "data:image/png;base64,iVBORw0KGgo=";
    const file = await dataUrlToShareFile(dataUrl, "proof-1");

    expect(file).toBeInstanceOf(File);
    expect(file.type).toBe("image/png");
    expect(file.name).toBe("proof-1.png");
  });
});

describe("shareEntryAttachmentImage", () => {
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

  it("shares the full attachment image with caption through native share", async () => {
    const file = makePngFile();
    const caption = "فاتورة مشتريات لمحل الشامي بتاريخ 13 يونيو 2026 ويوم السبت — تقفيلة B";

    const result = await shareEntryAttachmentImage({ file, caption, lang: "ar" });

    expect(navigator.share).toHaveBeenCalledWith({
      files: [file],
      text: caption,
      title: "فاتورة",
    });
    expect(result).toEqual({ ok: true, method: "share", copied: false });
  });
});
