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
});
