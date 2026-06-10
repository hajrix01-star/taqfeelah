import { describe, expect, it } from "vitest";
import {
  combineUiTotalsList,
  mapAttachmentsReportToProofs,
  mapChannelsReportToUiRows,
  mapDaysReportToUiRows,
  mapOutflowCategoriesToUi,
  mapOutflowTransactionsToUi,
  mapPeriodSummaryToTotals,
} from "./map-reports-to-ui";

describe("mapPeriodSummaryToTotals", () => {
  it("maps period summary payload to report totals", () => {
    const mapped = mapPeriodSummaryToTotals({
      totalSales: { amountHalalas: 100000 },
      totalOutflow: { amountHalalas: 30000 },
      netMovement: { amountHalalas: 70000 },
      outflowRatio: "30.0%",
      outflowRatioStatus: "calculable",
      attachmentCount: 4,
    });

    expect(mapped.sales).toBe(1000);
    expect(mapped.expense).toBe(300);
    expect(mapped.net).toBe(700);
    expect(mapped.proofs).toBe(4);
    expect(mapped).not.toHaveProperty("pending");
  });
});

describe("mapDaysReportToUiRows", () => {
  it("maps per-day SQL rows to notebook day rows", () => {
    const rows = mapDaysReportToUiRows([
      {
        date: "2026-06-01",
        totalSales: { amountHalalas: 50000 },
        totalOutflow: { amountHalalas: 10000 },
        netMovement: { amountHalalas: 40000 },
        outflowRatio: "20.0%",
        outflowRatioStatus: "calculable",
      },
    ]);

    expect(rows).toEqual([{
      id: "2026-06-01",
      dayAr: "2026-06-01",
      dayEn: "2026-06-01",
      sales: 500,
      expense: 100,
      net: 400,
      ratio: "20.0%",
      proofs: 0,
    }]);
  });
});

describe("mapChannelsReportToUiRows", () => {
  it("merges SQL channel totals with configured channels", () => {
    const rows = mapChannelsReportToUiRows(
      [{ salesChannelId: "channel-uuid", channelName: "Walk-in", amount: { amountHalalas: 25000 } }],
      [{ id: "walkin", nameAr: "محلي", nameEn: "Walk-in", amount: 0 }],
      { walkin: "channel-uuid" },
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("walkin");
    expect(rows[0].amount).toBe(250);
  });
});

describe("mapOutflowCategoriesToUi", () => {
  it("maps category totals and filters zero rows", () => {
    const rows = mapOutflowCategoriesToUi([
      { categoryKey: "rent", amountHalalas: 12000 },
      { categoryKey: "other", amountHalalas: 0 },
    ]);

    expect(rows).toEqual([{ id: "rent", amount: 120 }]);
  });
});

describe("mapOutflowTransactionsToUi", () => {
  it("maps transaction rows for outflow analysis", () => {
    const rows = mapOutflowTransactionsToUi([
      {
        id: "entry-1",
        date: "2026-06-05",
        type: "expense",
        categoryKey: "rent",
        amountHalalas: 5000,
        hasAttachment: true,
      },
    ], "store-1");

    expect(rows[0]).toMatchObject({
      id: "entry-1",
      businessId: "store-1",
      categoryId: "rent",
      amount: 50,
      attachment: { id: "entry-1-att" },
    });
  });
});

describe("mapAttachmentsReportToProofs", () => {
  it("maps attachment stats for proofs tab", () => {
    const mapped = mapAttachmentsReportToProofs({
      attachmentCount: 3,
      items: [{ entryId: "e1" }],
    });

    expect(mapped).toEqual({
      proofs: 3,
      items: [{ entryId: "e1" }],
    });
  });
});

describe("combineUiTotalsList", () => {
  it("aggregates combined report totals across stores", () => {
    const combined = combineUiTotalsList([
      { sales: 1000, expense: 200, net: 800, proofs: 1 },
      { sales: 500, expense: 100, net: 400, proofs: 2 },
    ]);

    expect(combined.sales).toBe(1500);
    expect(combined.expense).toBe(300);
    expect(combined.net).toBe(1200);
    expect(combined.proofs).toBe(3);
    expect(combined.ratio).toBe("20.0%");
    expect(combined).not.toHaveProperty("pending");
  });
});
