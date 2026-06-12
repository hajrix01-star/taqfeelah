import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { shareImageThroughWhatsApp } from "./notebook-image-sharing";

function makePngFile() {
  return new File([new Uint8Array([137, 80, 78, 71])], "closeout.png", { type: "image/png" });
}

describe("shareImageThroughWhatsApp", () => {
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

  it("uses native share with image before opening WhatsApp", async () => {
    const file = makePngFile();
    const caption = "تقفيلتي لمحل مشويات المعلم الشامي";

    const result = await shareImageThroughWhatsApp({ file, caption, title: "تقفيلتي" });

    expect(navigator.share).toHaveBeenCalledWith({
      files: [file],
      text: caption,
      title: "تقفيلتي",
    });
    expect(openSpy).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, method: "share", copied: false });
  });

  it("opens WhatsApp with caption only when no image file is provided", async () => {
    const caption = "تقفيلتي";

    const result = await shareImageThroughWhatsApp({ caption });

    expect(navigator.share).not.toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith(
      `https://wa.me/?text=${encodeURIComponent(caption)}`,
      "_blank",
      "noopener,noreferrer",
    );
    expect(result.method).toBe("text-only");
  });

  it("does not fall back to image-only share when caption is provided", async () => {
    const file = makePngFile();
    const caption = "تقفيلتي لمحل مشويات المعلم الشامي";
    const shareMock = vi.fn().mockResolvedValue(undefined);
    const canShareMock = vi.fn((payload: { text?: string; files?: File[] }) => (
      Boolean(payload.text) && Array.isArray(payload.files)
    ));
    vi.stubGlobal("navigator", {
      share: shareMock,
      canShare: canShareMock,
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        write: vi.fn().mockResolvedValue(undefined),
      },
    });

    const result = await shareImageThroughWhatsApp({ file, caption, allowFileOnlyFallback: false });

    expect(shareMock).toHaveBeenCalledOnce();
    expect(shareMock).toHaveBeenCalledWith({
      files: [file],
      text: caption,
    });
    expect(result).toEqual({ ok: true, method: "share", copied: false });
  });

  it("falls back to clipboard and WhatsApp when native share is unavailable", async () => {
    vi.stubGlobal("navigator", {
      share: undefined,
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
        write: vi.fn().mockResolvedValue(undefined),
      },
    });

    const file = makePngFile();
    const caption = "My closeout";

    const result = await shareImageThroughWhatsApp({ file, caption });

    expect(navigator.clipboard.write).toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith(
      `https://wa.me/?text=${encodeURIComponent(caption)}`,
      "_blank",
      "noopener,noreferrer",
    );
    expect(result).toEqual({ ok: true, method: "clipboard", copied: true });
  });
});
