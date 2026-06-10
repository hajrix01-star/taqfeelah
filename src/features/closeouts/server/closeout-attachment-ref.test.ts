import { describe, expect, it } from "vitest";
import { countCloseoutAttachments, isCloseoutAttachmentRef } from "./closeout-attachment-ref";

describe("closeout attachment refs", () => {
  it("counts legacy dataUrl strings and metadata refs", () => {
    expect(countCloseoutAttachments([
      "data:image/png;base64,abc",
      { id: "a", mimeType: "image/png", sizeBytes: 1, name: "a.png" },
      "",
      null,
    ])).toBe(2);
  });

  it("detects metadata refs", () => {
    expect(isCloseoutAttachmentRef({ id: "a", mimeType: "image/png", sizeBytes: 1, name: "a.png" })).toBe(true);
    expect(isCloseoutAttachmentRef("data:image/png;base64,abc")).toBe(false);
  });
});
