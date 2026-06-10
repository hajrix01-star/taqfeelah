import { describe, expect, it } from "vitest";
import { combineUiTotals, mapDaySummaryToUiTotals } from "./map-day-summary-to-ui";

describe("mapDaySummaryToUiTotals", () => {
  it("maps API halalas payload to owner home totals", () => {
    const mapped = mapDaySummaryToUiTotals({
      totalSales: { amountHalalas: 120000 },
      totalOutflow: { amountHalalas: 25000 },
      netMovement: { amountHalalas: 95000 },
      outflowRatio: "20.8%",
      outflowRatioStatus: "calculable",
      attachmentCount: 2,
    });

    expect(mapped).toEqual({
      sales: 1200,
      expense: 250,
      net: 950,
      ratio: "20.8%",
      proofs: 2,
    });
  });

  it("uses dash ratio when sales are zero but outflow exists", () => {
    const mapped = mapDaySummaryToUiTotals({
      totalSales: { amountHalalas: 0 },
      totalOutflow: { amountHalalas: 5000 },
      netMovement: { amountHalalas: -5000 },
      outflowRatio: "—",
      outflowRatioStatus: "notCalculable",
      attachmentCount: 0,
    });

    expect(mapped.ratio).toBe("—");
    expect(mapped.net).toBe(-50);
  });
});

describe("combineUiTotals", () => {
  it("aggregates per-store totals for combined home view", () => {
    const combined = combineUiTotals([
      { sales: 1000, expense: 200, net: 800, proofs: 1 },
      { sales: 500, expense: 100, net: 400, proofs: 0 },
    ]);

    expect(combined.sales).toBe(1500);
    expect(combined.expense).toBe(300);
    expect(combined.net).toBe(1200);
    expect(combined.proofs).toBe(1);
    expect(combined.ratio).toBe("20.0%");
    expect(combined).not.toHaveProperty("pending");
  });

  it("uses halala domain math instead of float drift for fractional riyals", () => {
    const combined = combineUiTotals([
      { sales: 0.1, expense: 0, net: 0.1, proofs: 0, pending: 0 },
      { sales: 0.2, expense: 0, net: 0.2, proofs: 0, pending: 0 },
    ]);

    expect(combined).toMatchObject({
      sales: 0.3,
      expense: 0,
      net: 0.3,
      ratio: "0.0%",
    });
  });
});
