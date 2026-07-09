import { describe, expect, it } from "vitest";
import {
  DEFAULT_REGISTER_LOG_FILTERS,
  applyRegisterReportGranularity,
  buildRegisterCloseoutSummaries,
  buildRegisterCloseoutSummariesFromRecords,
  buildRegisterDayReportRows,
  buildRegisterReportRows,
  buildRegisterSalesChannelOptions,
  filterRegisterLogEntries,
  formatNetMarginOfSalesRatio,
  registerLogFilterCount,
  resolveRegisterCloseoutActorLabel,
  summarizeRegisterPeriod,
} from "./register-log-display";
import { REGISTER_REPORT_GRANULARITY } from "@/features/reports/client/register-report-granularity";
import type { OperationalEntry } from "@/features/entries/client/entries-client-types";

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
      ] as unknown as OperationalEntry[],
      resolveChannelName: (row) => String((row as { channelId: string }).channelId),
      resolveStore: (businessId: string) => ({ id: businessId }),
      resolveActorLabel: () => "Owner",
    });
    expect(summaries).toHaveLength(1);
    expect(summaries[0].totals.sales).toBe(100);
    expect(summaries[0].displaySales).toBe(100);
    expect(summaries[0].totals.expense).toBe(10);
  });

  it("shows full collapsed income from salesChannels when summary amount is stale", () => {
    const summaries = buildRegisterCloseoutSummaries({
      filteredEntries: [
        {
          id: "e1",
          closeoutId: "c1",
          businessId: "b1",
          date: "2026-06-17",
          type: "summary",
          status: "active",
          amount: 100,
          salesChannels: [{ channelId: "card", amount: 5000 }],
          closeoutOwnerEditedAt: "2026-06-17T15:51:00.000Z",
        },
      ] as OperationalEntry[],
      resolveChannelName: () => "بطاقة",
      resolveStore: (businessId: string) => ({ id: businessId }),
      resolveActorLabel: () => "محمد خالد",
    });
    expect(summaries[0].displaySales).toBe(5000);
    expect(summaries[0].totals.sales).toBe(5000);
    expect(summaries[0].totals.net).toBe(5000);
    expect(summaries[0].salesChannels[0].amount).toBe(5000);
  });

  it("reconciles collapsed income when stored amount includes owner edit addition", () => {
    const summaries = buildRegisterCloseoutSummaries({
      filteredEntries: [
        {
          id: "e1",
          closeoutId: "c1",
          businessId: "b1",
          date: "2026-06-21",
          type: "summary",
          status: "active",
          amount: 10000,
          salesChannels: [
            { channelId: "cash", amount: 5000 },
            { channelId: "card", amount: 5000 },
          ],
          closeoutOwnerEditedAt: "2026-06-21T10:00:00.000Z",
        },
      ] as unknown as OperationalEntry[],
      resolveChannelName: (row) => String((row as { channelId: string }).channelId),
      resolveStore: (businessId: string) => ({ id: businessId }),
      resolveActorLabel: () => "محمد خالد",
    });
    expect(summaries[0].displaySales).toBe(10000);
    expect(summaries[0].totals.sales).toBe(10000);
    expect(summaries[0].totals.net).toBe(10000);
  });

  it("reconciles collapsed income from stored amount when channel rows are incomplete", () => {
    const summaries = buildRegisterCloseoutSummaries({
      filteredEntries: [
        {
          id: "e1",
          closeoutId: "c1",
          businessId: "b1",
          date: "2026-06-21",
          type: "summary",
          status: "active",
          amount: 10000,
          salesChannels: [{ channelId: "cash", amount: 5000 }],
          closeoutOwnerEditedAt: "2026-06-21T10:00:00.000Z",
        },
      ] as OperationalEntry[],
      resolveChannelName: () => "نقد",
      resolveStore: (businessId: string) => ({ id: businessId }),
      resolveActorLabel: () => "محمد خالد",
    });
    expect(summaries[0].displaySales).toBe(10000);
    expect(summaries[0].totals.sales).toBe(10000);
    expect(summaries[0].totals.net).toBe(10000);
  });

  it("labels owner-entered closeouts with the owner fallback when name is missing", () => {
    const label = resolveRegisterCloseoutActorLabel({
      entries: [
        { type: "summary", enteredBy: { userId: "owner-uuid", role: "owner", nameAr: "", nameEn: "" } },
        { type: "expense", enteredBy: { userId: "employee-1", nameAr: "أحمد", nameEn: "Ahmed" } },
      ],
    }, {
      ownerUserId: "owner-uuid",
      lang: "ar",
      enteredByOwnerLabel: "المالك",
    });
    expect(label).toBe("المالك");
  });

  it("labels closeouts from the summary actor instead of a mixed owner operation", () => {
    const label = resolveRegisterCloseoutActorLabel({
      entries: [
        { type: "expense", createdAt: "2026-06-06T11:00:00.000Z", enteredBy: { userId: "owner-uuid", role: "owner", nameAr: "خالد", nameEn: "Khalid" } },
        { type: "summary", createdAt: "2026-06-06T10:00:00.000Z", enteredBy: { userId: "employee-1", nameAr: "أحمد", nameEn: "Ahmed" } },
      ],
    }, {
      ownerUserId: "owner-uuid",
      lang: "ar",
      enteredByOwnerLabel: "المالك",
    });
    expect(label).toBe("أحمد");
  });

  it("does not label a deleted non-owner actor as the owner when the name snapshot is missing", () => {
    const label = resolveRegisterCloseoutActorLabel({
      entries: [
        { type: "summary", enteredBy: { userId: "deleted-user", role: "employee", nameAr: "", nameEn: "" } },
      ],
    }, {
      ownerUserId: "owner-uuid",
      lang: "ar",
      enteredByOwnerLabel: "المالك",
    });
    expect(label).toBe("مستخدم");
  });

  it("builds register day report rows sorted by newest date", () => {
    const rows = buildRegisterDayReportRows([
      { id: "1", type: "summary", status: "active", date: "2026-06-10", amount: 100, salesChannels: [] },
      { id: "2", type: "expense", status: "active", date: "2026-06-10", amount: 20 },
      { id: "3", type: "summary", status: "active", date: "2026-06-12", amount: 50, salesChannels: [] },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0].date).toBe("2026-06-12");
    expect(rows[0].sales).toBe(50);
    expect(rows[1].sales).toBe(100);
    expect(rows[1].expense).toBe(20);
    expect(rows[1].net).toBe(80);
  });

  it("aggregates register report rows by month", () => {
    const rows = buildRegisterReportRows([
      { id: "1", type: "summary", status: "active", date: "2026-06-10", amount: 100, salesChannels: [] },
      { id: "2", type: "expense", status: "active", date: "2026-06-10", amount: 20 },
      { id: "3", type: "summary", status: "active", date: "2026-06-12", amount: 50, salesChannels: [] },
      { id: "4", type: "summary", status: "active", date: "2026-05-03", amount: 30, salesChannels: [] },
    ], { granularity: REGISTER_REPORT_GRANULARITY.MONTH });

    expect(rows).toHaveLength(2);
    expect(rows[0].date).toBe("2026-06");
    expect(rows[0].sales).toBe(150);
    expect(rows[0].expense).toBe(20);
    expect(rows[0].net).toBe(130);
    expect(rows[1].date).toBe("2026-05");
    expect(rows[1].sales).toBe(30);
  });

  it("aggregates daily api rows into monthly rows", () => {
    const monthlyRows = applyRegisterReportGranularity([
      { id: "2026-06-10", date: "2026-06-10", sales: 100, expense: 20, net: 80 },
      { id: "2026-06-12", date: "2026-06-12", sales: 50, expense: 0, net: 50 },
      { id: "2026-05-03", date: "2026-05-03", sales: 30, expense: 0, net: 30 },
    ], REGISTER_REPORT_GRANULARITY.MONTH);

    expect(monthlyRows).toHaveLength(2);
    expect(monthlyRows[0].date).toBe("2026-06");
    expect(monthlyRows[0].sales).toBe(150);
  });

  it("formats net margin of sales ratio", () => {
    expect(formatNetMarginOfSalesRatio(100, 30)).toBe("30.0%");
    expect(formatNetMarginOfSalesRatio(0, 10)).toBe("—");
  });

  it("dedupes register payment method filter options by canonical key", () => {
    const cashUuid = "9bc40d4f-c773-4ba3-87db-b8bb1467dafb";
    const configuredChannels = [
      { id: "cash", legacyId: "cash", text: "cash", custom: false },
      { id: cashUuid, legacyId: "cash", text: "cash", custom: false },
    ];
    const options = buildRegisterSalesChannelOptions(
      [
        {
          type: "summary",
          salesChannels: [
            { channelId: "cash", amount: 100 },
            { channelId: cashUuid, amount: 50 },
          ],
        },
      ],
      (row) => row.channelId || "",
      "All",
      configuredChannels,
    );
    expect(options).toHaveLength(2);
    expect(options[1]).toEqual({ id: "cash", label: "cash" });
  });

  it("filters register entries by canonical payment method key", () => {
    const cashUuid = "9bc40d4f-c773-4ba3-87db-b8bb1467dafb";
    const configuredChannels = [{ id: cashUuid, legacyId: "cash", text: "cash", custom: false }];
    const entries = [
      {
        id: "1",
        type: "summary",
        status: "active",
        salesChannels: [{ channelId: cashUuid, amount: 100 }],
      },
      {
        id: "2",
        type: "summary",
        status: "active",
        salesChannels: [{ channelId: "jahez", amount: 50 }],
      },
    ];
    const filtered = filterRegisterLogEntries(
      entries,
      { ...DEFAULT_REGISTER_LOG_FILTERS, type: "summary", salesChannel: "cash" },
      undefined,
      configuredChannels,
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("1");
  });

  it("summarizes register period by canonical payment method key", () => {
    const cashUuid = "9bc40d4f-c773-4ba3-87db-b8bb1467dafb";
    const configuredChannels = [{ id: cashUuid, legacyId: "cash", text: "cash", custom: false }];
    const summary = summarizeRegisterPeriod(
      [
        {
          id: "1",
          type: "summary",
          status: "active",
          salesChannels: [
            { channelId: "cash", amount: 0.1 },
            { channelId: cashUuid, amount: 0.2 },
          ],
        },
      ],
      "cash",
      [{ id: "cash", label: "Cash" }],
      "Channel",
      configuredChannels,
    );
    expect(summary).toEqual({ mode: "channel", label: "Cash", amount: 0.3 });
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
      ] as unknown as OperationalEntry[],
      resolveChannelName: (row) => String((row as { channelId: string }).channelId),
      resolveStore: (businessId: string) => ({ id: businessId }),
      resolveActorLabel: () => "Ahmed",
    });
    expect(summaries[0].ownerEditedAt).toBe("2026-06-11T10:00:00.000Z");
    expect(summaries[0].ownerEditedByName).toBe("Owner");
  });

  it("builds register closeout summaries from server closeout records", () => {
    const summaries = buildRegisterCloseoutSummariesFromRecords({
      closeouts: [
        {
          id: "closeout-1",
          storeId: "b1",
          date: "2026-06-06",
          daySequence: 2,
          submittedByName: "أحمد",
          submittedByUserId: "employee-1",
          submittedAt: "2026-06-06T10:00:00.000Z",
          sales: [{ channelId: "cash", name: "نقد", amount: 100 }],
          outflows: [{ id: "out-1", type: "expense", amount: 25, categoryId: "other" }],
          totals: { sales: 100, expense: 25, net: 75 },
        },
      ],
      resolveChannelName: (row) => String(row.name || row.channelId || ""),
      resolveStore: (businessId: string) => ({ id: businessId }),
    });

    expect(summaries).toHaveLength(1);
    expect(summaries[0].closeoutId).toBe("closeout-1");
    expect(summaries[0].actorLabel).toBe("أحمد");
    expect(summaries[0].totals).toEqual({ sales: 100, expense: 25, net: 75 });
    expect(summaries[0].operations).toHaveLength(2);
  });
});
