import { describe, expect, it, vi } from "vitest";
import {
  buildRegisterServerReadModel,
  shouldEnableRegisterReportRead,
} from "./use-register-server-read-model";
import type { OperationalEntry } from "./entries-client-types";

describe("register server read model", () => {
  it("enables report reads for the register server source", () => {
    expect(shouldEnableRegisterReportRead({ enabled: true })).toBe(true);
    expect(shouldEnableRegisterReportRead({ enabled: false })).toBe(false);
  });

  it("maps entries and report states into one register read model", async () => {
    const loadMore = vi.fn(async () => true);
    const loadAllRemaining = vi.fn(async () => undefined);
    const refetch = vi.fn(() => ({ ok: true }));
    const entry = { id: "entry-1", businessId: "store-1" } as OperationalEntry;

    const model = buildRegisterServerReadModel({
      entries: {
        entries: [entry],
        loading: false,
        loaded: true,
        error: "",
        hasMore: true,
        loadingMore: false,
        loadingAll: false,
        loadMore,
        loadAllRemaining,
        refetch,
      },
      report: {
        daysRows: [{ id: "2026-06-01", dayAr: "1", dayEn: "1", sales: 10, expense: 2, net: 8, ratio: "20.0%", proofs: 1 }],
        singleStoreTotals: { sales: 10, expense: 2, net: 8, ratio: "20.0%", proofs: 1 },
        combinedTotals: { sales: 30, expense: 5, net: 25, ratio: "16.7%", proofs: 2 },
        loading: false,
        loaded: true,
        error: "",
      },
      closeouts: {
        closeouts: [{ id: "closeout-1", storeId: "store-1", date: "2026-06-01" }],
        loading: false,
        loaded: true,
        error: "",
        refetch,
      },
    });

    expect(model.entries).toEqual([entry]);
    expect(model.entriesLoaded).toBe(true);
    expect(model.entriesHasMore).toBe(true);
    expect(model.entriesLoadingAll).toBe(false);
    expect(model.closeouts).toHaveLength(1);
    expect(model.closeoutsLoaded).toBe(true);
    expect(model.reportLoaded).toBe(true);
    expect(model.reportCombinedTotals.net).toBe(25);
    await expect(model.loadMoreEntries()).resolves.toBe(true);
    await expect(model.loadAllEntries()).resolves.toBeUndefined();
    expect(model.refetchEntries()).toEqual({ ok: true });
  });
});
