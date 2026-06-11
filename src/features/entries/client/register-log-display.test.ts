import { describe, expect, it } from "vitest";
import {
  DEFAULT_REGISTER_LOG_FILTERS,
  buildRegisterCloseoutSummaries,
  filterRegisterLogEntries,
  registerLogFilterCount,
  summarizeRegisterPeriod,
} from "./register-log-display";

describe("register-log-display", () => {
  it("counts active register log filters", () => {
    expect(registerLogFilterCount(DEFAULT_REGISTER_LOG_FILTERS)).toBe(0);
    expect(registerLogFilterCount({ ...DEFAULT_REGISTER_LOG_FILTERS, type: "expense", attachmentOnly: true })).toBe(2);
  });

  it("filters register log entries by status and type", () => {
    const entries = [
      { id: "1", type: "summary", status: "active", businessId: "b1", date: "2026-06-06" },
      { id: "2", type: "expense", status: "voided", businessId: "b1", date: "2026-06-06" },
    ];
    const filtered = filterRegisterLogEntries(entries, { ...DEFAULT_REGISTER_LOG_FILTERS, status: "active", type: "summary" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("1");
  });

  it("summarizes register period channel filter with halala math", () => {
    const summary = summarizeRegisterPeriod([
      {
        id: "1",
        type: "summary",
        status: "active",
        amount: 0.3,
        salesChannels: [
          { channelId: "cash", amount: 0.1 },
          { channelId: "cash", amount: 0.2 },
        ],
      },
    ], "cash", [{ id: "cash", label: "Cash" }]);
    expect(summary).toEqual({ mode: "channel", label: "Cash", amount: 0.3 });
  });

  it("summarizes register period totals", () => {
    const summary = summarizeRegisterPeriod([
      { id: "1", type: "summary", status: "active", amount: 100, salesChannels: [] },
      { id: "2", type: "expense", status: "active", amount: 20 },
    ], "all", []);
    expect(summary).toEqual({ mode: "totals", sales: 100, expense: 20, net: 80 });
  });

  it("groups closeout summaries by closeout id", () => {
    const summaries = buildRegisterCloseoutSummaries({
      filteredEntries: [
        { id: "e1", closeoutId: "c1", businessId: "b1", date: "2026-06-06", type: "summary", status: "active", amount: 100, salesChannels: [{ channelId: "cash", amount: 100 }] },
        { id: "e2", closeoutId: "c1", businessId: "b1", date: "2026-06-06", type: "expense", status: "active", amount: 10, categoryId: "other" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test fixture
      ] as any[],
      resolveChannelName: (row) => String((row as { channelId: string }).channelId),
      resolveStore: (businessId: string) => ({ id: businessId }),
      resolveActorLabel: () => "Owner",
    });
    expect(summaries).toHaveLength(1);
    expect(summaries[0].totals.sales).toBe(100);
    expect(summaries[0].totals.expense).toBe(10);
  });

  it("carries owner edit metadata into closeout summaries", () => {
    const summaries = buildRegisterCloseoutSummaries({
      filteredEntries: [
        {
          id: "e1",
          closeoutId: "c1",
          businessId: "b1",
          date: "2026-06-06",
          type: "summary",
          status: "active",
          amount: 100,
          closeoutOwnerEditedAt: "2026-06-11T10:00:00.000Z",
          closeoutOwnerEditedByName: "Owner",
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test fixture
      ] as any[],
      resolveChannelName: (row) => String((row as { channelId: string }).channelId),
      resolveStore: (businessId: string) => ({ id: businessId }),
      resolveActorLabel: () => "Ahmed",
    });
    expect(summaries[0].ownerEditedAt).toBe("2026-06-11T10:00:00.000Z");
    expect(summaries[0].ownerEditedByName).toBe("Owner");
  });
});
