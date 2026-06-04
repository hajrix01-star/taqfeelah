import { describe, expect, it } from "vitest";
import { calculateDaySummary } from "./calculations";

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
