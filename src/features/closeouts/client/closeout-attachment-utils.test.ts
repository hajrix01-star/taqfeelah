import { describe, expect, it } from "vitest";
import {
  countAllCloseoutProofAttachments,
  countCloseoutAttachments,
  countOutflowAttachments,
  normalizeCloseoutAttachmentList,
} from "./closeout-attachment-utils";

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

  it("counts outflow and closeout-level proofs together", () => {
    const proof = "data:image/png;base64,abc";
    expect(countOutflowAttachments([
      { attachments: [proof] },
      { attachments: [] },
    ])).toBe(1);
    expect(countAllCloseoutProofAttachments({
      attachments: [proof],
      outflows: [{ attachments: [proof] }],
    })).toBe(2);
  });
});
