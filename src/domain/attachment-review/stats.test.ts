import { describe, expect, it } from "vitest";
import {
  applyReviewEnabledToAttachmentStats,
  countPendingReviewsFromUiEntries,
  countProofsFromUiEntries,
  resolvePendingReviewCountForDisplay,
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

  it("counts pending only when review is enabled for the store", () => {
    expect(countPendingReviewsFromUiEntries(entries, () => true)).toBe(2);
    expect(countPendingReviewsFromUiEntries(entries, () => false)).toBe(0);
    expect(countPendingReviewsFromUiEntries(entries, (businessId) => businessId === "shami")).toBe(1);
  });

  it("zeros pending review count when review workflow is disabled", () => {
    expect(resolvePendingReviewCountForDisplay(4, false)).toBe(0);
    expect(resolvePendingReviewCountForDisplay(4, true)).toBe(4);
  });

  it("applies review gate to server attachment stats without changing proof count", () => {
    expect(applyReviewEnabledToAttachmentStats({ attachmentCount: 5, pendingReviewCount: 2 }, false)).toEqual({
      attachmentCount: 5,
      pendingReviewCount: 0,
    });
    expect(applyReviewEnabledToAttachmentStats({ attachmentCount: 5, pendingReviewCount: 2 }, true)).toEqual({
      attachmentCount: 5,
      pendingReviewCount: 2,
    });
  });
});
