import { describe, expect, it } from "vitest";
import {
  buildBusinessesWithEntrySummaries,
  entryTotalsHaveActivity,
  preferLocalTotalsOverEmptyApi,
} from "./operational-analytics";

describe("operational analytics summary helpers", () => {
  it("detects activity in totals", () => {
    expect(entryTotalsHaveActivity({ sales: 0, expense: 0, proofs: 0, pending: 0 })).toBe(false);
    expect(entryTotalsHaveActivity({ sales: 100, expense: 0, proofs: 0, pending: 0 })).toBe(true);
  });

  it("prefers local totals when API totals are empty but local has activity", () => {
    const local = { sales: 500, expense: 50, net: 450, ratio: "10.0%", proofs: 1, pending: 0 };
    const api = { sales: 0, expense: 0, net: 0, ratio: "0.0%", proofs: 0, pending: 0 };
    expect(preferLocalTotalsOverEmptyApi(local, api)).toEqual(local);
    expect(preferLocalTotalsOverEmptyApi(local, null)).toEqual(local);
    expect(preferLocalTotalsOverEmptyApi(local, { sales: 100, expense: 0, net: 100, ratio: "0.0%", proofs: 0, pending: 0 })).toEqual({
      sales: 100,
      expense: 0,
      net: 100,
      ratio: "0.0%",
      proofs: 0,
      pending: 0,
    });
  });

  it("builds per-store day summaries from operational entries", () => {
    const businesses = buildBusinessesWithEntrySummaries({
      businesses: [{ id: "shami" }, { id: "arz" }],
      operationalEntries: [
        { id: "1", type: "summary", status: "active", businessId: "shami", date: "2026-06-07", amount: 300 },
        { id: "2", type: "expense", status: "active", businessId: "shami", date: "2026-06-07", amount: 50 },
        { id: "3", type: "summary", status: "active", businessId: "arz", date: "2026-06-07", amount: 200 },
      ],
      monthly: false,
      selectedDate: "2026-06-07",
      selectedMonth: "2026-06",
    });

    expect(businesses[0].day).toMatchObject({ sales: 300, expense: 50, net: 250 });
    expect(businesses[1].day).toMatchObject({ sales: 200, expense: 0, net: 200 });
  });
});
