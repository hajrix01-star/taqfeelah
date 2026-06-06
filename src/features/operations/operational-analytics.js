/** Pure helpers for operational entry filtering and totals (prototype + tests). */

import {
  countPendingReviewsFromUiEntries,
  countProofsFromUiEntries,
} from "@/domain/attachment-review/stats";

export const OUTFLOW_ENTRY_TYPES = new Set(["purchases", "expense", "withdrawal"]);

export function entryHasAttachment(entry) {
  return Boolean(entry?.attachment);
}

export function entryIsVoided(entry) {
  return entry?.status === "voided";
}

export function entryIsActive(entry) {
  return !entryIsVoided(entry);
}

export function entryIsOutflow(entry) {
  return OUTFLOW_ENTRY_TYPES.has(entry?.type);
}

export function monthSelectionValue(value) {
  const legacyMonths = { may2026: "2026-05", april2026: "2026-04", march2026: "2026-03" };
  return legacyMonths[value] || (/^[0-9]{4}-[0-9]{2}$/.test(value || "") ? value : "2026-05");
}

export function entryDateMatches(entry, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo) {
  if (period === "day") return entry.date === selectedDate;
  if (period === "month") return entry.date.startsWith(monthSelectionValue(selectedMonth));
  if (period === "year") return entry.date.startsWith(`${selectedYear}-`);
  return entry.date >= customFrom && entry.date <= customTo;
}

export function entriesInPeriod(
  entries,
  businessId,
  period,
  selectedDate,
  selectedMonth,
  selectedYear = "2026",
  customFrom = "2026-01-01",
  customTo = "2026-12-31",
) {
  return entries.filter(
    (entry) =>
      (!businessId || entry.businessId === businessId)
      && entryDateMatches(entry, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo),
  );
}

export function summarizeEntries(entries, reviewEnabledForBusiness = () => false) {
  const activeEntries = entries.filter(entryIsActive);
  const sales = activeEntries.filter((entry) => entry.type === "summary").reduce((sum, entry) => sum + entry.amount, 0);
  const expense = activeEntries.filter(entryIsOutflow).reduce((sum, entry) => sum + entry.amount, 0);
  const proofs = countProofsFromUiEntries(activeEntries);
  const pending = countPendingReviewsFromUiEntries(activeEntries, reviewEnabledForBusiness);
  const ratio = sales > 0 ? `${((expense / sales) * 100).toFixed(1)}%` : expense > 0 ? "—" : "0.0%";
  return { sales, expense, net: sales - expense, ratio, proofs, pending };
}

export function summaryMonthFromEntries(entries, businessId, month, reviewEnabledForBusiness = () => false) {
  return summarizeEntries(entriesInPeriod(entries, businessId, "month", "", month), reviewEnabledForBusiness);
}

export function aggregateChannels(entries, businessId, period, selectedDate, selectedMonth, baseChannels = []) {
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

export function duplicateSalesSignature(entries = []) {
  return entries.map((entry) => entry.id).sort().join("|");
}

export function duplicateSalesGroupKey(group) {
  return `${group.businessId}|${group.date}`;
}
