import { describe, expect, it } from "vitest";
import { registerInlineAttachment, resolveInlineAttachmentDataUrl } from "./inline-attachment";

const tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("registerInlineAttachment", () => {
  it("returns stable inline storage key", () => {
    const first = registerInlineAttachment({
      kind: "image",
      name: "receipt.png",
      mimeType: "image/png",
      sizeBytes: 120,
      dataUrl: tinyPng,
    });
    const second = registerInlineAttachment({
      kind: "image",
      name: "receipt.png",
      mimeType: "image/png",
      sizeBytes: 120,
      dataUrl: tinyPng,
    });

    expect(first.storageKey).toBe(second.storageKey);
    expect(first.storageKey.startsWith("inline:v1:")).toBe(true);
    expect(resolveInlineAttachmentDataUrl(first.storageKey)).toBe(tinyPng);
  });

  it("keeps legacy raw data URLs readable", () => {
    expect(resolveInlineAttachmentDataUrl(tinyPng)).toBe(tinyPng);
  });

  it("does not expose unknown storage keys as inline data", () => {
    expect(resolveInlineAttachmentDataUrl("object-storage/receipt.jpg")).toBe("");
  });

  it("rejects unsupported mime type", () => {
    expect(() => registerInlineAttachment({
      kind: "image",
      mimeType: "application/pdf",
      sizeBytes: 120,
      dataUrl: tinyPng,
    })).toThrow("Unsupported attachment mime type.");
  });
});
