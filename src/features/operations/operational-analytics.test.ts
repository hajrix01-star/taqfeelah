import { describe, expect, it } from "vitest";
import {
  aggregateChannels,
  aggregateSalesChannelsFromGroupEntries,
  buildBusinessesWithEntrySummaries,
  entryTotalsHaveActivity,
  entryTotalsHaveFinancialActivity,
  preferLocalTotalsOverEmptyApi,
  resolveOwnerPeriodSummaryPreference,
  resolveOwnerSingleStoreTotals,
  summarizeEntries,
} from "./operational-analytics";

describe("operational analytics summary helpers", () => {
  it("detects activity in totals", () => {
    expect(entryTotalsHaveActivity({ sales: 0, expense: 0, proofs: 0 })).toBe(false);
    expect(entryTotalsHaveActivity({ sales: 100, expense: 0, proofs: 0 })).toBe(true);
  });

  it("prefers local totals when API totals are empty but local has activity", () => {
    const local = { sales: 500, expense: 50, net: 450, ratio: "10.0%", proofs: 1 };
    const api = { sales: 0, expense: 0, net: 0, ratio: "0.0%", proofs: 0 };
    expect(preferLocalTotalsOverEmptyApi(local, api)).toEqual(local);
    expect(preferLocalTotalsOverEmptyApi(local, null)).toEqual(local);
    expect(preferLocalTotalsOverEmptyApi(local, { sales: 100, expense: 0, net: 100, ratio: "0.0%", proofs: 0 })).toEqual({
      sales: 100,
      expense: 0,
      net: 100,
      ratio: "0.0%",
      proofs: 0,
    });
  });

  it("treats API totals with only zero financials as empty for local preference", () => {
    const local = { sales: 500, expense: 50, net: 450, ratio: "10.0%", proofs: 0 };
    const api = { sales: 0, expense: 0, net: 0, ratio: "0.0%", proofs: 2 };
    expect(entryTotalsHaveActivity(api)).toBe(true);
    expect(entryTotalsHaveFinancialActivity(api)).toBe(false);
    expect(resolveOwnerPeriodSummaryPreference({ localTotals: local, apiTotals: api })).toBe(true);
    expect(preferLocalTotalsOverEmptyApi(local, api)).toEqual(local);
  });

  it("always prefers entry-derived totals when local has financial activity", () => {
    const local = { sales: 200, expense: 0, net: 200, ratio: "0.0%", proofs: 0 };
    const api = { sales: 150, expense: 0, net: 150, ratio: "0.0%", proofs: 0 };
    expect(resolveOwnerPeriodSummaryPreference({ localTotals: local, apiTotals: api })).toBe(true);
  });

  it("avoids locking onto empty API totals while entries are still loading", () => {
    const empty = { sales: 0, expense: 0, net: 0, ratio: "0.0%", proofs: 0 };
    expect(resolveOwnerPeriodSummaryPreference({
      localTotals: empty,
      apiTotals: empty,
      entriesLoading: true,
    })).toBe(true);
  });

  it("falls back to API totals only after entries settle without financial activity", () => {
    const empty = { sales: 0, expense: 0, net: 0, ratio: "0.0%", proofs: 0 };
    const api = { sales: 400, expense: 20, net: 380, ratio: "5.0%", proofs: 0 };
    expect(resolveOwnerPeriodSummaryPreference({
      localTotals: empty,
      apiTotals: api,
      entriesLoading: false,
    })).toBe(false);
    expect(resolveOwnerSingleStoreTotals(empty, api, false)).toEqual(api);
  });

  it("prefers API totals in DB source mode while entries are loading", () => {
    const empty = { sales: 0, expense: 0, net: 0, ratio: "0.0%", proofs: 0 };
    const demo = { sales: 900, expense: 50, net: 850, ratio: "5.6%", proofs: 0 };
    expect(resolveOwnerPeriodSummaryPreference({
      localTotals: demo,
      apiTotals: empty,
      entriesLoading: true,
      entriesDbSource: true,
    })).toBe(false);
  });

  it("always prefers API totals in DB source mode even when local entries have activity", () => {
    const local = { sales: 900, expense: 50, net: 850, ratio: "5.6%", proofs: 0 };
    const api = { sales: 400, expense: 20, net: 380, ratio: "5.0%", proofs: 0 };
    expect(resolveOwnerPeriodSummaryPreference({
      localTotals: local,
      apiTotals: api,
      entriesLoading: false,
      entriesDbSource: true,
    })).toBe(false);
    expect(resolveOwnerSingleStoreTotals(local, api, false, { entriesDbSource: true })).toEqual(api);
  });

  it("aggregates sales channels with halala math", () => {
    const channels = aggregateSalesChannelsFromGroupEntries([
      {
        type: "summary",
        status: "active",
        salesChannels: [
          { channelId: "cash", amount: 0.1 },
          { channelId: "cash", amount: 0.2 },
        ],
      },
    ]);
    expect(channels).toEqual([{ channelId: "cash", name: "cash", amount: 0.3 }]);
  });

  it("uses halala domain math instead of float drift for fractional riyals", () => {
    const entries = [
      { type: "summary", amount: 0.1, status: "active" },
      { type: "summary", amount: 0.2, status: "active" },
    ];
    expect(summarizeEntries(entries)).toMatchObject({
      sales: 0.3,
      expense: 0,
      net: 0.3,
      ratio: "0.0%",
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

  it("maps Arabic channel snapshots to built-in channel shapes for translation", () => {
    const rows = aggregateChannels(
      [{
        type: "summary",
        status: "active",
        businessId: "arz",
        date: "2026-06-14",
        salesChannels: [
          { channelId: "bank-uuid", name: "بنك", amount: 351 },
          { channelId: "cash-uuid", name: "نقد", amount: 50 },
        ],
      }],
      "arz",
      "day",
      "2026-06-14",
      "2026-06",
      [],
    );

    expect(rows).toEqual([
      { id: "bank-uuid", text: "bank", custom: false, amount: 351 },
      { id: "cash-uuid", text: "cash", custom: false, amount: 50 },
    ]);
  });
});
