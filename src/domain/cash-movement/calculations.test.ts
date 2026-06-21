import { describe, expect, it } from "vitest";
import {
  addUiAmounts,
  calculateDaySummary,
  combineDaySummaries,
  combineUiTotalsFromSummaries,
  daySummaryToUiTotals,
  reconcileSummarySalesDisplayRiyals,
  rowsFromUiEntries,
  sumUiAmounts,
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

  it("prefers salesChannels sum over stale summary amount after owner edit", () => {
    const summary = calculateDaySummary(rowsFromUiEntries([
      {
        type: "summary",
        amount: 100,
        status: "active",
        salesChannels: [{ amount: 5000 }],
      },
    ]));

    expect(daySummaryToUiTotals(summary)).toMatchObject({
      sales: 5000,
      expense: 0,
      net: 5000,
    });
  });

  it("prefers stored summary amount when channel rows are incomplete after owner edit", () => {
    const summary = calculateDaySummary(rowsFromUiEntries([
      {
        type: "summary",
        amount: 10000,
        status: "active",
        salesChannels: [{ amount: 5000 }],
      },
    ]));

    expect(daySummaryToUiTotals(summary)).toMatchObject({
      sales: 10000,
      expense: 0,
      net: 10000,
    });
  });
});

describe("reconcileSummarySalesDisplayRiyals", () => {
  it("returns stored amount when no channel rows exist", () => {
    expect(reconcileSummarySalesDisplayRiyals(7500, [])).toBe(7500);
  });

  it("returns channel sum when stored amount is stale low", () => {
    expect(reconcileSummarySalesDisplayRiyals(100, [5000])).toBe(5000);
  });

  it("returns stored amount when channel rows are incomplete", () => {
    expect(reconcileSummarySalesDisplayRiyals(10000, [5000])).toBe(10000);
  });

  it("sums multiple channels when stored amount matches", () => {
    expect(reconcileSummarySalesDisplayRiyals(10000, [5000, 5000])).toBe(10000);
  });
});

describe("addUiAmounts / sumUiAmounts", () => {
  it("avoids float drift when combining fractional riyals", () => {
    expect(addUiAmounts(0.1, 0.2)).toBe(0.3);
    expect(sumUiAmounts([0.1, 0.2, 0.01])).toBe(0.31);
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
