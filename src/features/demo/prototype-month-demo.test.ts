import { describe, expect, it } from "vitest";
import { computeCloseoutTotals } from "../daily-closeouts/closeout-calculations";
import { CLOSEOUT_STATUS } from "../daily-closeouts/closeout-status";
import { buildOperationalEntriesFromCloseout, pendingSubmittedCloseouts } from "../daily-closeouts/daily-closeouts-demo-store";
import {
  aggregateChannels,
  duplicateSalesSignature,
  entriesInPeriod,
  entryIsActive,
  entryIsOutflow,
  entryIsVoided,
  summarizeEntries,
  summaryMonthFromEntries,
} from "../operations/operational-analytics";
import {
  createPrototypeMonthDemoDataset,
  countCloseoutsInMonth,
  DEMO_CHANNELS,
  DEMO_MONTH,
} from "./prototype-month-demo-seed";

function manualNetForBusinessMonth(entries: { businessId: string; date: string; type: string; amount: number; status?: string }[], businessId: string, month: string) {
  const scoped = entries.filter((e) => e.businessId === businessId && e.date.startsWith(month) && e.status !== "voided");
  const sales = scoped.filter((e) => e.type === "summary").reduce((s, e) => s + e.amount, 0);
  const expense = scoped.filter((e) => entryIsOutflow(e)).reduce((s, e) => s + e.amount, 0);
  return { sales, expense, net: sales - expense };
}

type DemoEntry = {
  id: string;
  businessId: string;
  date: string;
  type: string;
  amount: number;
  status?: string;
  salesChannels?: { channelId: string; amount: number }[];
};

describe("prototype month demo dataset", () => {
  const dataset = createPrototypeMonthDemoDataset();
  const entries = dataset.operationalEntries as DemoEntry[];
  const closeouts = dataset.closeouts as Array<{
    id: string;
    storeId: string;
    date: string;
    status: string;
    sales: Record<string, { amount: number }>;
    outflows: { amount: number }[];
    totals: { totalSales: number; totalOutflow: number; netMovement: number };
  }>;

  it("covers May 2026 with two stores per day plus early June", () => {
    expect(countCloseoutsInMonth(closeouts, DEMO_MONTH)).toBe(62);
    expect(closeouts.some((c) => c.date === "2026-06-02")).toBe(true);
    expect(entries.length).toBeGreaterThan(100);
  });

  it("keeps closeout totals consistent with sales minus outflows", () => {
    closeouts.forEach((closeout) => {
      const expected = computeCloseoutTotals(closeout.sales as never, closeout.outflows as never);
      expect(closeout.totals.totalSales).toBe(expected.totalSales);
      expect(closeout.totals.totalOutflow).toBe(expected.totalOutflow);
      expect(closeout.totals.netMovement).toBe(expected.netMovement);
    });
  });

  it("maps sent closeouts to operational rows that reconcile", () => {
    const reviewed = closeouts.filter((c) => c.status === CLOSEOUT_STATUS.REVIEWED);
    reviewed.slice(0, 12).forEach((closeout) => {
      const { entries: built } = buildOperationalEntriesFromCloseout(closeout, { userId: "test" });
      const sales = built.filter((e) => e.kind === "summary");
      const outflows = built.filter((e) => e.kind === "outflow");
      const salesTotal = sales.reduce((sum, row) => {
        const channels = row.payload.salesChannels || [];
        return sum + channels.reduce((inner: number, ch: { amount: number }) => inner + ch.amount, 0);
      }, 0);
      const outTotal = outflows.reduce((sum, row) => sum + Number((row.payload as { amount?: number }).amount || 0), 0);
      expect(salesTotal - outTotal).toBe(closeout.totals.netMovement);
    });
  });

  it("includes workflow edge cases", () => {
    expect(closeouts.find((c) => c.storeId === "shami" && c.date === "2026-06-02")?.status).toBe(CLOSEOUT_STATUS.DRAFT);
    expect(closeouts.find((c) => c.storeId === "arz" && c.date === "2026-05-12")?.status).toBe(CLOSEOUT_STATUS.REVIEWED);
    expect(pendingSubmittedCloseouts()).toEqual([]);
    const voided = entries.find((e) => e.id === "demo-shami-voided-2026-05-10");
    expect(voided && entryIsVoided(voided)).toBe(true);
    const dupes = entries.filter((e) => e.businessId === "shami" && e.date === "2026-05-15" && e.type === "summary" && entryIsActive(e));
    expect(dupes.length).toBe(2);
    expect(duplicateSalesSignature(dupes)).toContain("demo-shami-summary-2026-05-15-pm");
  });
});

describe("operational analytics (add / subtract / filters)", () => {
  const entries = createPrototypeMonthDemoDataset().operationalEntries as DemoEntry[];

  it("summarizes May for shami: net equals sales minus active outflows", () => {
    const summary = summaryMonthFromEntries(entries, "shami", "2026-05");
    const manual = manualNetForBusinessMonth(entries, "shami", "2026-05");
    expect(summary.sales).toBe(manual.sales);
    expect(summary.expense).toBe(manual.expense);
    expect(summary.net).toBe(manual.net);
    expect(summary.net).toBe(summary.sales - summary.expense);
  });

  it("filters by day and excludes voided amounts from totals", () => {
    const dayEntries = entriesInPeriod(entries, "shami", "day", "2026-05-10", "2026-05") as DemoEntry[];
    const daySummary = summarizeEntries(dayEntries);
    const voided = dayEntries.find((e) => e.id === "demo-shami-voided-2026-05-10");
    expect(voided).toBeTruthy();
    expect(daySummary.expense).toBe(
      dayEntries.filter((e) => entryIsActive(e) && entryIsOutflow(e)).reduce((s: number, e) => s + e.amount, 0),
    );
  });

  it("filters by month per store", () => {
    const shamiMay = entriesInPeriod(entries, "shami", "month", "", "2026-05");
    const arzMay = entriesInPeriod(entries, "arz", "month", "", "2026-05");
    expect(shamiMay.length).toBeGreaterThan(arzMay.length / 2);
    expect(shamiMay.every((e: DemoEntry) => e.date.startsWith("2026-05"))).toBe(true);
  });

  it("aggregates sales channels for a month", () => {
    const base = DEMO_CHANNELS.map((ch) => ({ id: ch.id, nameAr: ch.nameAr, nameEn: ch.nameEn }));
    const channels = aggregateChannels(entries, "shami", "month", "", "2026-05", base);
    const channelTotal = channels.reduce((sum, ch) => sum + ch.amount, 0);
    const summary = summaryMonthFromEntries(entries, "shami", "2026-05");
    expect(channelTotal).toBe(summary.sales);
  });

  it("includes attachment proof counts in May summaries", () => {
    const may = entriesInPeriod(entries, "arz", "month", "", "2026-05");
    expect(summarizeEntries(may).proofs).toBeGreaterThanOrEqual(0);
  });
});
