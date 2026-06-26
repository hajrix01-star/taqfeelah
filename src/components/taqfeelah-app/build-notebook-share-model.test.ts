import { describe, expect, it } from "vitest";
import { buildNotebookShareModel } from "./build-notebook-share-model";
import { businesses } from "./taqfeelah-app-catalog-data";

const emptyApi = {
  apiEntries: null,
  apiRecord: null,
  apiChannelRows: null,
  apiDayRows: null,
};

describe("buildNotebookShareModel", () => {
  it("uses snapshot per-store rows for combined mode instead of empty operational entries", () => {
    const model = buildNotebookShareModel({
      snapshot: {
        theme: "yellow",
        period: "day",
        selectedBusiness: "all",
        includedBusinessIds: ["shami", "arz"],
        selectedDate: "2026-06-07",
        screen: "home",
        summaryRecord: { sales: 500, expense: 50, net: 450, ratio: "10.0%", proofs: 0 },
        summaryBusinessRows: [
          { businessId: "shami", sales: 300, expense: 50, net: 250, ratio: "16.7%" },
          { businessId: "arz", sales: 200, expense: 0, net: 200, ratio: "0.0%" },
        ],
      },
      lang: "ar",
      businessesList: businesses,
      operationalEntries: [],
      archivedBusinessIds: [],
      ...emptyApi,
    });

    expect(model.shareBusinessRows).toHaveLength(2);
    expect(model.shareBusinessRows[0]).toMatchObject({ sales: 300, expense: 50, net: 250 });
    expect(model.shareBusinessRows[1]).toMatchObject({ sales: 200, expense: 0, net: 200 });
    expect(model.record).toMatchObject({ sales: 500, expense: 50, net: 450 });
    expect(model.shareCaption).toBe("تقفيلة مقارنة المحلات ليوم 07-06-2026");
  });

  it("includes channel and outflow details in caption and image rows when showDetails is enabled", () => {
    const model = buildNotebookShareModel({
      snapshot: {
        theme: "yellow",
        period: "day",
        selectedBusiness: "shami",
        selectedDate: "2026-06-07",
        screen: "home",
        showDetails: true,
        summaryRecord: { sales: 1000, expense: 200, net: 800, ratio: "20.0%", proofs: 0 },
        snapshotChannelRows: [{ id: "cash", label: "كاش", amount: 600 }],
        snapshotOutflowCategories: [{ id: "purchases", amount: 150 }],
      },
      lang: "ar",
      businessesList: businesses,
      operationalEntries: [],
      archivedBusinessIds: [],
      ...emptyApi,
    });

    expect(model.detailedSummary).toBe(true);
    expect(model.salesDetailRows).toHaveLength(1);
    expect(model.salesDetailRows[0].label).toBe("كاش");
    expect(model.outflowDetailRows).toHaveLength(1);
    expect(model.shareCaption).toBe("تقفيلة محل مشويات المعلم الشامي ليوم 07-06-2026");
  });

  it("prefers API channel rows for detail breakdown when snapshot rows are absent", () => {
    const model = buildNotebookShareModel({
      snapshot: {
        theme: "yellow",
        period: "day",
        selectedBusiness: "shami",
        selectedDate: "2026-06-07",
        screen: "home",
        showDetails: true,
      },
      lang: "ar",
      businessesList: businesses,
      operationalEntries: [],
      archivedBusinessIds: [],
      apiEntries: null,
      apiRecord: { sales: 500, expense: 100, net: 400, ratio: "20.0%", proofs: 0 },
      apiChannelRows: [{ id: "visa", label: "فيزا", amount: 500 }],
      apiDayRows: null,
    });

    expect(model.salesDetailRows).toHaveLength(1);
    expect(model.salesDetailRows[0].label).toBe("فيزا");
  });
});
