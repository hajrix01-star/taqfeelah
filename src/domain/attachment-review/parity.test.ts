import { describe, expect, it } from "vitest";
import {
  applyReviewEnabledToAttachmentStats,
  countProofsFromUiEntries,
} from "@/domain/attachment-review/stats";
import { summarizeEntries } from "@/features/operations/operational-analytics";

describe("attachment review parity", () => {
  const entries = [
    { businessId: "shami", type: "summary", amount: 100, attachment: { id: "a1" }, reviewed: false, status: "active" },
    { businessId: "shami", type: "expense", amount: 20, attachment: { id: "a2" }, reviewed: true, status: "active" },
    { businessId: "shami", type: "expense", amount: 10, attachment: { id: "a3" }, reviewed: false, status: "voided" },
    { businessId: "shami", type: "expense", amount: 5, status: "active" },
  ];

  it("keeps summarizeEntries proofs aligned with domain counters and zero pending", () => {
    const totals = summarizeEntries(entries);

    expect(totals.proofs).toBe(countProofsFromUiEntries(entries));
    expect(totals.pending).toBe(0);
  });

  it("keeps server display gate aligned with zero pending reviews", () => {
    const totals = summarizeEntries(entries);
    const serverStats = applyReviewEnabledToAttachmentStats(
      { attachmentCount: 2, pendingReviewCount: 1 },
    );

    expect(totals.pending).toBe(0);
    expect(serverStats.pendingReviewCount).toBe(0);
    expect(totals.proofs).toBe(serverStats.attachmentCount);
  });
});
