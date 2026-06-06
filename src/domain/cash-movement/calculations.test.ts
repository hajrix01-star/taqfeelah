import { describe, expect, it } from "vitest";
import {
  calculateDaySummary,
  combineDaySummaries,
  combineUiTotalsFromSummaries,
  daySummaryToUiTotals,
  rowsFromUiEntries,
} from "./calculations";

describe("calculateDaySummary", () => {
  it("aggregates sales and outflow", () => {
    const summary = calculateDaySummary([
      { type: "summary", amountHalalas: 12500 },
      { type: "summary", amountHalalas: 4500 },
      { type: "expense", amountHalalas: 2000 },
      { type: "withdrawal", amountHalalas: 1000 },
    ]);

    expect(summary.totalSalesHalalas).toBe(17000);
    expect(summary.totalOutflowHalalas).toBe(3000);
    expect(summary.netMovementHalalas).toBe(14000);
    expect(summary.outflowRatio).toBe("17.6%");
    expect(summary.outflowRatioStatus).toBe("calculable");
  });

  it("returns not calculable when sales are zero and outflow exists", () => {
    const summary = calculateDaySummary([{ type: "expense", amountHalalas: 1500 }]);

    expect(summary.totalSalesHalalas).toBe(0);
    expect(summary.totalOutflowHalalas).toBe(1500);
    expect(summary.netMovementHalalas).toBe(-1500);
    expect(summary.outflowRatio).toBe("—");
    expect(summary.outflowRatioStatus).toBe("notCalculable");
  });
});

describe("rowsFromUiEntries", () => {
  it("excludes voided rows before halala conversion", () => {
    const summary = calculateDaySummary(rowsFromUiEntries([
      { type: "summary", amount: 50, status: "active" },
      { type: "summary", amount: 100, status: "voided" },
      { type: "expense", amount: 10, status: "active" },
    ]));

    expect(daySummaryToUiTotals(summary)).toMatchObject({
      sales: 50,
      expense: 10,
      net: 40,
      ratio: "20.0%",
    });
  });
});

describe("combineDaySummaries", () => {
  it("recomputes ratio from combined halalas", () => {
    const combined = combineDaySummaries([
      calculateDaySummary([
        { type: "summary", amountHalalas: 100000 },
        { type: "expense", amountHalalas: 20000 },
      ]),
      calculateDaySummary([
        { type: "summary", amountHalalas: 50000 },
        { type: "expense", amountHalalas: 10000 },
      ]),
    ]);

    expect(combineUiTotalsFromSummaries([
      calculateDaySummary([
        { type: "summary", amountHalalas: 100000 },
        { type: "expense", amountHalalas: 20000 },
      ]),
      calculateDaySummary([
        { type: "summary", amountHalalas: 50000 },
        { type: "expense", amountHalalas: 10000 },
      ]),
    ])).toEqual({
      sales: 1500,
      expense: 300,
      net: 1200,
      ratio: "20.0%",
    });
    expect(combined.outflowRatio).toBe("20.0%");
  });
});
