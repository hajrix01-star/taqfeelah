import { describe, expect, it } from "vitest";
import {
  buildNotebookExportRequest,
  canFetchNotebookExportForSnapshot,
  mapNotebookExportToShareData,
} from "./notebook-export-share-data.js";

describe("notebook export share data", () => {
  it("skips combined store snapshots", () => {
    expect(canFetchNotebookExportForSnapshot({ selectedBusiness: "all" }, true)).toBe(false);
    expect(canFetchNotebookExportForSnapshot({ selectedBusiness: "shami" }, true)).toBe(true);
  });

  it("builds day export request from snapshot", () => {
    const request = buildNotebookExportRequest({
      selectedBusiness: "shami",
      period: "day",
      selectedDate: "2026-06-05",
    });
    expect(request).toMatchObject({
      storeId: "shami",
      period: "day",
      date: "2026-06-05",
      from: "2026-06-05",
      to: "2026-06-05",
    });
  });

  it("maps notebook export payload into share modal metrics", () => {
    const mapped = mapNotebookExportToShareData({
      storeId: "shami",
      totals: { sales: 100, expense: 20, net: 80, ratio: "20.0%", proofs: 1 },
      channels: [{ channelId: "cash", name: "Cash", amount: 100 }],
      operations: [{
        id: "entry-1",
        date: "2026-06-05",
        type: "summary",
        amount: 100,
        note: "",
        hasAttachment: true,
        createdAt: "2026-06-05T10:00:00.000Z",
      }],
    }, { selectedBusiness: "shami" });

    expect(mapped?.record.sales).toBe(100);
    expect(mapped?.shareChannelRows[0].label).toBe("Cash");
    expect(mapped?.entries[0].businessId).toBe("shami");
    expect(mapped?.proofs).toBe(1);
  });

  it("uses channel-aware day totals when export operation amount is stale", () => {
    const mapped = mapNotebookExportToShareData({
      storeId: "shami",
      totals: { sales: 5000, expense: 0, net: 5000, ratio: "0.0%", proofs: 0 },
      channels: [{ channelId: "card", name: "Card", amount: 5000 }],
      operations: [{
        id: "entry-1",
        date: "2026-06-17",
        type: "summary",
        amount: 100,
        salesChannels: [{ channelId: "card", name: "Card", amount: 5000 }],
        note: "",
        createdAt: "2026-06-17T10:00:00.000Z",
      }],
    }, { selectedBusiness: "shami" });

    expect(mapped?.entries[0].amount).toBe(5000);
    expect(mapped?.shareDayRows[0]?.sales).toBe(5000);
  });
});
