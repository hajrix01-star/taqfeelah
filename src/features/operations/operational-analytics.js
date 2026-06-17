/** Pure helpers for operational entry filtering and totals (prototype + tests). */

import { countProofsFromUiEntries } from "@/domain/attachment-stats/stats";
import {
  addUiAmounts,
  calculateDaySummary,
  daySummaryToUiTotals,
  rowsFromUiEntries,
} from "@/domain/cash-movement/calculations";
import { isEntriesApiDbSourceMode } from "@/core/config/entries-api-mode";
import {
  entryRowMatchesIncomeSourceFilter,
  resolveAggregatedChannelShape,
} from "@/features/org-config/client/sales-channel-display";

export const OUTFLOW_ENTRY_TYPES = new Set(["purchases", "expense", "withdrawal"]);

export function entryHasAttachment(entry) {
  if (Boolean(entry?.attachment)) return true;
  return Array.isArray(entry?.attachments) && entry.attachments.length > 0;
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

export function summarizeEntries(entries) {
  const list = Array.isArray(entries) ? entries : [];
  const activeEntries = list.filter(entryIsActive);
  const summary = calculateDaySummary(rowsFromUiEntries(list));
  const totals = daySummaryToUiTotals(summary, {
    proofs: countProofsFromUiEntries(activeEntries),
  });
  return {
    sales: totals.sales,
    expense: totals.expense,
    net: totals.net,
    ratio: totals.ratio,
    proofs: totals.proofs,
  };
}

export function summaryMonthFromEntries(entries, businessId, month) {
  return summarizeEntries(entriesInPeriod(entries, businessId, "month", "", month));
}

export function summaryDayFromEntries(entries, businessId, date, formatDayLabel) {
  const format = typeof formatDayLabel === "function"
    ? formatDayLabel
    : (value) => value;
  return {
    id: date,
    dayAr: format(date, "ar"),
    dayEn: format(date, "en"),
    fullAr: format(date, "ar"),
    fullEn: format(date, "en"),
    ...summarizeEntries(entriesInPeriod(entries, businessId, "day", date, "2026-05")),
  };
}

export function newestEntries(entries) {
  return [...(Array.isArray(entries) ? entries : [])].sort(
    (a, b) => `${b.date}|${b.createdAt || ""}`.localeCompare(`${a.date}|${a.createdAt || ""}`),
  );
}

export function aggregateSalesChannelsFromGroupEntries(
  entries,
  channelFilter = "all",
  resolveChannelName = (row) => row.name || row.channelId,
  configuredChannels = [],
) {
  const map = new Map();
  (Array.isArray(entries) ? entries : []).filter(entryIsActive).forEach((entry) => {
    if (entry.type !== "summary") return;
    (entry.salesChannels || []).forEach((row) => {
      if (!row?.channelId || Number(row.amount) <= 0) return;
      const name = resolveChannelName(row);
      const current = map.get(row.channelId) || { channelId: row.channelId, name, amount: 0 };
      map.set(row.channelId, {
        ...current,
        amount: addUiAmounts(current.amount, Number(row.amount)),
      });
    });
  });
  let result = [...map.values()].sort((a, b) => b.amount - a.amount);
  if (channelFilter !== "all") {
    result = result.filter(
      (row) => entryRowMatchesIncomeSourceFilter(row, channelFilter, configuredChannels),
    );
  }
  return result;
}

export function aggregateChannels(entries, businessId, period, selectedDate, selectedMonth, baseChannels = []) {
  const relevant = entriesInPeriod(entries, businessId, period, selectedDate, selectedMonth).filter(
    (entry) => entry.type === "summary" && entryIsActive(entry),
  );
  const mapped = new Map(baseChannels.map((channel) => [channel.id, { ...channel, amount: 0 }]));
  relevant.forEach((entry) => (entry.salesChannels || []).forEach((row) => {
    const configured = resolveAggregatedChannelShape(row, baseChannels);
    const mapKey = configured.id || row.channelId;
    const current = mapped.get(mapKey) || mapped.get(row.channelId) || configured;
    mapped.set(mapKey, {
      ...current,
      amount: addUiAmounts(current.amount, row.amount),
    });
  }));
  return [...mapped.values()].filter((channel) => channel.amount > 0);
}

export function entryTotalsHaveFinancialActivity(totals) {
  if (!totals || typeof totals !== "object") return false;
  return (Number(totals.sales) || 0) > 0 || (Number(totals.expense) || 0) > 0;
}

export function entryTotalsHaveActivity(totals) {
  if (!totals || typeof totals !== "object") return false;
  return entryTotalsHaveFinancialActivity(totals)
    || (Number(totals.proofs) || 0) > 0;
}

export function preferLocalTotalsOverEmptyApi(localTotals, apiTotals) {
  if (!apiTotals) return localTotals;
  if (entryTotalsHaveFinancialActivity(localTotals) && !entryTotalsHaveFinancialActivity(apiTotals)) {
    return localTotals;
  }
  return apiTotals;
}

/**
 * Owner home/reports: choose entry-derived totals vs SQL summary API.
 * Entries win whenever they carry financial activity; while entries are still
 * loading we avoid locking onto a faster empty API snapshot.
 */
export function resolveOwnerPeriodSummaryPreference({
  localTotals,
  apiTotals,
  entriesLoading = false,
  entriesDbSource = isEntriesApiDbSourceMode(),
}) {
  if (entriesDbSource) {
    return false;
  }
  if (entryTotalsHaveFinancialActivity(localTotals)) return true;
  if (entriesLoading) return true;
  return !entryTotalsHaveFinancialActivity(apiTotals);
}

export function resolveOwnerSingleStoreTotals(
  localTotals,
  apiTotals,
  preferEntryDerived,
  { entriesDbSource = isEntriesApiDbSourceMode() } = {},
) {
  if (entriesDbSource) {
    if (apiTotals != null) return apiTotals;
    return localTotals;
  }
  return preferEntryDerived
    ? localTotals
    : preferLocalTotalsOverEmptyApi(localTotals, apiTotals);
}

/**
 * @param {Object} input
 * @param {Array<{ id?: string, day?: object, month?: object }>} [input.businesses]
 * @param {Array<{ id?: string, businessId?: string, date?: string, type?: string, status?: string, amount?: number }>} [input.operationalEntries]
 * @param {boolean} [input.monthly]
 * @param {string} [input.selectedDate]
 * @param {string} [input.selectedMonth]
 */
export function buildBusinessesWithEntrySummaries({
  businesses = [],
  operationalEntries = [],
  monthly = false,
  selectedDate = "",
  selectedMonth = "",
}) {
  const periodKey = monthly ? "month" : "day";
  return businesses.map((business) => {
    const record = monthly
      ? summaryMonthFromEntries(operationalEntries, business.id, selectedMonth)
      : summarizeEntries(
        entriesInPeriod(operationalEntries, business.id, "day", selectedDate, selectedMonth),
      );
    return {
      ...business,
      [periodKey]: {
        sales: record.sales,
        expense: record.expense,
        net: record.net,
        ratio: record.ratio,
        proofs: record.proofs,
      },
    };
  });
}

export function duplicateSalesSignature(entries = []) {
  return entries.map((entry) => entry.id).sort().join("|");
}

export function duplicateSalesGroupKey(group) {
  return `${group.businessId}|${group.date}`;
}
