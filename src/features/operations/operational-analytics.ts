import { formatCalendarDate } from "@/utils/display-helpers";

/**
 * Pure helpers for operational entry filtering, totals, and closeout calculations.
 *
 * This is the single client-side source of truth for all financial aggregations.
 * computeCloseoutTotals and salesArrayFromRecord from closeout-calculations.js
 * are re-exported from here — that file is kept for backward compatibility only.
 *
 * Server-side authoritative source: src/domain/cash-movement/calculations.ts (halalas integers).
 * Client-side source (riyals floats): this file.
 */

export type EntryStatus = "active" | "voided";
export type OperationalEntryType = "summary" | "purchases" | "expense" | "withdrawal";

export type OperationalEntry = {
  id?: string;
  businessId: string;
  date: string;
  type: string;
  amount: number;
  status?: string;
  attachment?: unknown;
  reviewed?: boolean;
  salesChannels?: { channelId: string; amount: number; name?: string }[];
  [key: string]: unknown;
};

export type OperationalSummary = {
  sales: number;
  expense: number;
  net: number;
  ratio: string;
  proofs: number;
  pending: number;
};

export const OUTFLOW_ENTRY_TYPES = new Set<OperationalEntryType>([
  "purchases",
  "expense",
  "withdrawal",
]);

export function entryHasAttachment(entry: OperationalEntry): boolean {
  return Boolean(entry?.attachment);
}

export function entryIsVoided(entry: OperationalEntry): boolean {
  return entry?.status === "voided";
}

export function entryIsActive(entry: OperationalEntry): boolean {
  return !entryIsVoided(entry);
}

export function entryIsOutflow(entry: OperationalEntry): boolean {
  return OUTFLOW_ENTRY_TYPES.has(entry?.type as OperationalEntryType);
}

export function monthSelectionValue(value: string | undefined): string {
  const legacyMonths: Record<string, string> = {
    may2026: "2026-05",
    april2026: "2026-04",
    march2026: "2026-03",
  };
  return legacyMonths[value ?? ""] || (/^[0-9]{4}-[0-9]{2}$/.test(value || "") ? value! : "2026-05");
}

export function entryDateMatches(
  entry: OperationalEntry,
  period: string,
  selectedDate: string,
  selectedMonth: string,
  selectedYear: string,
  customFrom: string,
  customTo: string,
): boolean {
  if (period === "day") return entry.date === selectedDate;
  if (period === "month") return entry.date.startsWith(monthSelectionValue(selectedMonth));
  if (period === "year") return entry.date.startsWith(`${selectedYear}-`);
  return entry.date >= customFrom && entry.date <= customTo;
}

export function entriesInPeriod(
  entries: OperationalEntry[],
  businessId: string | null | undefined,
  period: string,
  selectedDate: string,
  selectedMonth: string,
  selectedYear = "2026",
  customFrom = "2026-01-01",
  customTo = "2026-12-31",
): OperationalEntry[] {
  return entries.filter(
    (entry) =>
      (!businessId || entry.businessId === businessId)
      && entryDateMatches(entry, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo),
  );
}

export function summarizeEntries(
  entries: OperationalEntry[],
  reviewEnabledForBusiness: (businessId: string) => boolean = () => false,
): OperationalSummary {
  const activeEntries = entries.filter(entryIsActive);
  const sales = activeEntries
    .filter((entry) => entry.type === "summary")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const expense = activeEntries.filter(entryIsOutflow).reduce((sum, entry) => sum + entry.amount, 0);
  const proofs = activeEntries.filter(entryHasAttachment).length;
  const pending = activeEntries.filter(
    (entry) => entryHasAttachment(entry) && !entry.reviewed && reviewEnabledForBusiness(entry.businessId),
  ).length;
  const ratio = sales > 0 ? `${((expense / sales) * 100).toFixed(1)}%` : expense > 0 ? "—" : "0.0%";
  return { sales, expense, net: sales - expense, ratio, proofs, pending };
}

export function summaryMonthFromEntries(
  entries: OperationalEntry[],
  businessId: string,
  month: string,
  reviewEnabledForBusiness: (businessId: string) => boolean = () => false,
): OperationalSummary {
  return summarizeEntries(entriesInPeriod(entries, businessId, "month", "", month), reviewEnabledForBusiness);
}

export function summaryDayFromEntries(
  entries: OperationalEntry[],
  businessId: string,
  date: string,
  reviewEnabledForBusiness: (businessId: string) => boolean = () => false,
): OperationalSummary & {
  id: string;
  dayAr: string;
  dayEn: string;
  fullAr: string;
  fullEn: string;
} {
  return {
    id: date,
    dayAr: formatCalendarDate(date, "ar"),
    dayEn: formatCalendarDate(date, "en"),
    fullAr: formatCalendarDate(date, "ar"),
    fullEn: formatCalendarDate(date, "en"),
    ...summarizeEntries(entriesInPeriod(entries, businessId, "day", date, ""), reviewEnabledForBusiness),
  };
}

export function aggregateChannels(
  entries: OperationalEntry[],
  businessId: string,
  period: string,
  selectedDate: string,
  selectedMonth: string,
  baseChannels: { id: string; [key: string]: unknown }[] = [],
): { id: string; amount: number; custom?: boolean; nameAr?: string; nameEn?: string; [key: string]: unknown }[] {
  const relevant = entriesInPeriod(entries, businessId, period, selectedDate, selectedMonth).filter(
    (entry) => entry.type === "summary" && entryIsActive(entry),
  );
  const mapped = new Map(baseChannels.map((channel) => [channel.id, { ...channel, amount: 0 }]));
  relevant.forEach((entry) => (entry.salesChannels || []).forEach((row) => {
    const current = mapped.get(row.channelId) || {
      id: row.channelId,
      custom: true,
      nameAr: row.name || row.channelId,
      nameEn: row.name || row.channelId,
      amount: 0,
    };
    mapped.set(row.channelId, { ...current, amount: current.amount + row.amount });
  }));
  return [...mapped.values()].filter((channel) => channel.amount > 0);
}

export function duplicateSalesSignature(entries: OperationalEntry[]): string {
  return entries.map((entry) => entry.id).sort().join("|");
}

export function duplicateSalesGroupKey(group: { businessId: string; date: string }): string {
  return `${group.businessId}|${group.date}`;
}

// ─── Closeout totals (migrated from closeout-calculations.js) ────
// These are re-exported here so callers can import from a single module.

type SalesChannelRow = { channelId?: string; id?: string; name?: string; amount: number };
type SalesInput = SalesChannelRow[] | Record<string, number | SalesChannelRow>;
type OutflowRow = { id?: string; amount: number };

/**
 * Compute totalSales / totalOutflow / netMovement from closeout draft data.
 * Input units: riyals (client-side floats). Not interchangeable with server halalas.
 */
export function computeCloseoutTotals(
  sales: SalesInput,
  outflows: OutflowRow[] = [],
): { totalSales: number; totalOutflow: number; netMovement: number } {
  let totalSales = 0;
  if (Array.isArray(sales)) {
    totalSales = sales.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  } else if (sales && typeof sales === "object") {
    totalSales = Object.values(sales as Record<string, unknown>).reduce<number>((sum, value) => {
      const amount = typeof value === "number" ? value : Number(((value as SalesChannelRow).amount) || 0);
      return sum + amount;
    }, 0);
  }
  const totalOutflow = (outflows || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  return { totalSales, totalOutflow, netMovement: totalSales - totalOutflow };
}

/** Build a named sales record from channel definitions + user-entered values. */
export function salesRecordFromChannels(
  salesChannels: { id: string; displayName?: string; nameAr?: string; nameEn?: string; name?: string }[],
  valuesById: Record<string, number>,
): Record<string, SalesChannelRow> {
  const record: Record<string, SalesChannelRow> = {};
  salesChannels.forEach((channel) => {
    const amount = Number(valuesById[channel.id] || 0);
    if (amount > 0) {
      record[channel.id] = {
        channelId: channel.id,
        name: channel.displayName || channel.nameAr || channel.nameEn || channel.name || channel.id,
        amount,
      };
    }
  });
  return record;
}

/** Normalise sales input to a flat array of { channelId, name, amount }. */
export function salesArrayFromRecord(salesRecord: SalesInput | null | undefined): SalesChannelRow[] {
  if (!salesRecord) return [];
  if (Array.isArray(salesRecord)) return salesRecord as SalesChannelRow[];
  return Object.values(salesRecord).map((row) => {
    const r = row as SalesChannelRow;
    return { channelId: r.channelId || r.id, name: r.name, amount: Number(r.amount || 0) };
  });
}
