import { describe, expect, it } from "vitest";
import {
  resolveCloseoutDisplayTotals,
  resolveCloseoutRecordDisplayTotals,
} from "./closeout-calculations";

describe("resolveCloseoutDisplayTotals", () => {
  it("recomputes totals when stored totals disagree with sales rows", () => {
    const totals = resolveCloseoutDisplayTotals(
      [{ channelId: "card", amount: 5000 }],
      [],
      { totalSales: 100, totalOutflow: 0, netMovement: 100 },
    );
    expect(totals.totalSales).toBe(5000);
    expect(totals.netMovement).toBe(5000);
  });

  it("keeps stored totals when they already match sales rows", () => {
    const stored = { totalSales: 5000, totalOutflow: 200, netMovement: 4800 };
    const totals = resolveCloseoutDisplayTotals(
      [{ channelId: "card", amount: 5000 }],
      [{ id: "o1", type: "expense", amount: 200 }],
      stored,
    );
    expect(totals).toBe(stored);
  });
});

describe("resolveCloseoutRecordDisplayTotals", () => {
  it("returns zero totals for missing closeout", () => {
    expect(resolveCloseoutRecordDisplayTotals(null)).toEqual({
      totalSales: 0,
      totalOutflow: 0,
      netMovement: 0,
    });
  });
});
