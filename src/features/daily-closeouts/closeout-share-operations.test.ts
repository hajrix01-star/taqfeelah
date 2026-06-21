import { describe, expect, it } from "vitest";
import { closeoutShareTotals, normalizeCloseoutShareTotals } from "./closeout-share-operations";

describe("normalizeCloseoutShareTotals", () => {
  it("reads API submit ack totals in halalas", () => {
    expect(normalizeCloseoutShareTotals({
      totalSalesHalalas: 150000,
      totalOutflowHalalas: 32500,
      netMovementHalalas: 117500,
      outflowRatio: "21.7%",
    })).toEqual({
      sales: 1500,
      expense: 325,
      net: 1175,
      ratio: "21.7%",
    });
  });

  it("reads persisted closeout totals in riyals", () => {
    expect(normalizeCloseoutShareTotals({
      totalSales: 900,
      totalOutflow: 100,
      netMovement: 800,
    })).toEqual({
      sales: 900,
      expense: 100,
      net: 800,
      ratio: null,
    });
  });
});

describe("closeoutShareTotals", () => {
  it("uses halalas totals from API ack-shaped closeout objects", () => {
    const totals = closeoutShareTotals({
      totals: {
        totalSalesHalalas: 120000,
        totalOutflowHalalas: 0,
        netMovementHalalas: 120000,
      },
    });
    expect(totals.sales).toBe(1200);
    expect(totals.expense).toBe(0);
    expect(totals.net).toBe(1200);
  });

  it("prefers sales rows over stale persisted totals when both exist", () => {
    const totals = closeoutShareTotals({
      sales: [{ channelId: "card", amount: 5000 }],
      totals: { totalSales: 100, totalOutflow: 0, netMovement: 100 },
    } as import("./daily-closeouts-types").DailyCloseoutRecord);
    expect(totals.sales).toBe(5000);
    expect(totals.net).toBe(5000);
  });
});
