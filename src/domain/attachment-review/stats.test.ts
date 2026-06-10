import { describe, expect, it } from "vitest";
import {
  applyReviewEnabledToAttachmentStats,
  countProofsFromUiEntries,
} from "./stats";

describe("attachment review stats", () => {
  const entries = [
    { businessId: "shami", attachment: { id: "a1" }, reviewed: false, status: "active" },
    { businessId: "shami", attachment: { id: "a2" }, reviewed: true, status: "active" },
    { businessId: "arz", attachment: { id: "a3" }, reviewed: false, status: "active" },
    { businessId: "shami", attachment: { id: "a4" }, reviewed: false, status: "voided" },
    { businessId: "shami", reviewed: false, status: "active" },
  ];

  it("counts proofs from active entries with attachments", () => {
    expect(countProofsFromUiEntries(entries)).toBe(3);
  });

  it("always zeros pending review count in display stats", () => {
    expect(applyReviewEnabledToAttachmentStats({ attachmentCount: 5, pendingReviewCount: 2 })).toEqual({
      attachmentCount: 5,
      pendingReviewCount: 0,
    });
  });
});
