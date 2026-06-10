import { describe, expect, it } from "vitest";
import { countCloseoutAttachments, normalizeCloseoutAttachmentList } from "./closeout-attachment-utils";

describe("closeout attachment utils", () => {
  it("normalizes mixed attachment lists", () => {
    const list = normalizeCloseoutAttachmentList([
      "data:image/png;base64,abc",
      { id: "a", mimeType: "image/png", sizeBytes: 1, name: "a.png" },
      null,
    ]);
    expect(list).toHaveLength(2);
    expect(countCloseoutAttachments(list)).toBe(2);
  });
});
