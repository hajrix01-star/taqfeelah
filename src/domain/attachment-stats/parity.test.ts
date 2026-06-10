import { describe, expect, it } from "vitest";
import {
  countProofsFromUiEntries,
  normalizeAttachmentCount,
} from "@/domain/attachment-stats/stats";
import { summarizeEntries } from "@/features/operations/operational-analytics";

describe("attachment stats parity", () => {
  const entries = [
    { businessId: "shami", type: "summary", amount: 100, attachment: { id: "a1" }, reviewed: false, status: "active" },
    { businessId: "shami", type: "expense", amount: 20, attachment: { id: "a2" }, reviewed: true, status: "active" },
    { businessId: "shami", type: "expense", amount: 10, attachment: { id: "a3" }, reviewed: false, status: "voided" },
    { businessId: "shami", type: "expense", amount: 5, status: "active" },
  ];

  it("keeps summarizeEntries proofs aligned with domain counters", () => {
    const totals = summarizeEntries(entries);

    expect(totals.proofs).toBe(countProofsFromUiEntries(entries));
  });

  it("keeps server attachment stats aligned with entry proof counts", () => {
    const totals = summarizeEntries(entries);
    const serverStats = normalizeAttachmentCount({ attachmentCount: 2 });

    expect(totals.proofs).toBe(serverStats.attachmentCount);
  });
});
