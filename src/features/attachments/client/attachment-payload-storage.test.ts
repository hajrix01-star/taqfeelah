import { describe, expect, it } from "vitest";
import {
  approximateDataUrlBytes,
  makeAttachment,
  stripEmbeddedAttachmentImages,
} from "./attachment-payload-storage.js";

describe("prototype attachment storage helpers", () => {
  it("makeAttachment prefixes id when prepared payload exists", () => {
    expect(makeAttachment("entry-1", { kind: "image", name: "a.jpg" })).toEqual({
      kind: "image",
      name: "a.jpg",
      id: "attachment-entry-1",
    });
    expect(makeAttachment("entry-1", null)).toBeNull();
  });

  it("stripEmbeddedAttachmentImages removes inline dataUrl from entries", () => {
    const entries = [
      { id: "1", attachment: { id: "a1", dataUrl: "data:image/jpeg;base64,abc" } },
      { id: "2" },
    ];
    expect(stripEmbeddedAttachmentImages(entries)).toEqual([
      { id: "1", attachment: { id: "a1", dataUrl: undefined } },
      { id: "2" },
    ]);
  });

  it("approximateDataUrlBytes estimates base64 payload size", () => {
    expect(approximateDataUrlBytes("abcd")).toBe(3);
  });
});
