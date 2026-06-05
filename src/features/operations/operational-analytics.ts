/** Pure helpers for operational entry filtering and totals (prototype + tests). */

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
