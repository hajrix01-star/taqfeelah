/** Pure helpers for operational entry filtering and totals (runtime + tests). */

import { countProofsFromUiEntries } from "@/domain/attachment-stats/stats";
import { todayBusinessDateIso } from "@/core/date/business-date";
import {
  addUiAmounts,
  calculateDaySummary,
  daySummaryToUiTotals,
  rowsFromUiEntries,
  type UiEntryLike,
} from "@/domain/cash-movement/calculations";
import { isEntriesApiDbSourceMode } from "@/core/config/entries-api-mode";
import {
  entryRowMatchesIncomeSourceFilter,
  resolveAggregatedChannelShape,
  resolveRegisterIncomeSourceFilterKey,
} from "@/features/org-config/client/sales-channel-display";
import { sanitizeCloseoutChannelDisplayName } from "@/features/daily-closeouts/closeout-sales-normalize";
import type {
  AnalyticsBusinessRef,
  AnalyticsDaySummaryRow,
  AnalyticsEntry,
  AnalyticsSalesChannelRow,
  AnalyticsTotals,
  BuildBusinessesWithEntrySummariesInput,
  DuplicateSalesGroup,
  FormatDayLabelFn,
  ResolveChannelNameFn,
  ResolveOwnerPeriodSummaryPreferenceInput,
  ResolveOwnerSingleStoreTotalsOptions,
} from "@/features/operations/operations-types";

export const OUTFLOW_ENTRY_TYPES = new Set(["purchases", "expense", "withdrawal"]);
const EMPTY_ANALYTICS_TOTALS: AnalyticsTotals = { sales: 0, expense: 0, net: 0, ratio: "0.0%", proofs: 0 };

function currentBusinessMonth(): string {
  return todayBusinessDateIso().slice(0, 7);
}

function currentBusinessYear(): string {
  return todayBusinessDateIso().slice(0, 4);
}

function currentBusinessYearStart(): string {
  return `${currentBusinessYear()}-01-01`;
}

function currentBusinessYearEnd(): string {
  return `${currentBusinessYear()}-12-31`;
}

export function entryHasAttachment(entry: AnalyticsEntry | null | undefined): boolean {
  if (Boolean(entry?.attachment)) return true;
  return Array.isArray(entry?.attachments) && entry.attachments.length > 0;
}

export function entryIsVoided(entry: AnalyticsEntry | null | undefined): boolean {
  return entry?.status === "voided";
}

export function entryIsActive(entry: AnalyticsEntry | null | undefined): boolean {
  return !entryIsVoided(entry);
}

export function entryIsOutflow(entry: AnalyticsEntry | null | undefined): boolean {
  return OUTFLOW_ENTRY_TYPES.has(String(entry?.type));
}

export function monthSelectionValue(value: string | null | undefined): string {
  return /^[0-9]{4}-[0-9]{2}$/.test(value || "") ? value! : currentBusinessMonth();
}

export function entryDateMatches(
  entry: AnalyticsEntry,
  period: string,
  selectedDate: string,
  selectedMonth: string,
  selectedYear: string,
  customFrom: string,
  customTo: string,
): boolean {
  const date = String(entry.date || "");
  if (period === "day") return date === selectedDate;
  if (period === "month") return date.startsWith(monthSelectionValue(selectedMonth));
  if (period === "year") return date.startsWith(`${selectedYear}-`);
  return date >= customFrom && date <= customTo;
}

export function entriesInPeriod(
  entries: AnalyticsEntry[],
  businessId: string,
  period: string,
  selectedDate: string,
  selectedMonth: string,
  selectedYear = currentBusinessYear(),
  customFrom = currentBusinessYearStart(),
  customTo = currentBusinessYearEnd(),
): AnalyticsEntry[] {
  return entries.filter(
    (entry) =>
      (!businessId || entry.businessId === businessId)
      && entryDateMatches(entry, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo),
  );
}

export function summarizeEntries(entries: AnalyticsEntry[]): AnalyticsTotals {
  const list = Array.isArray(entries) ? entries : [];
  const activeEntries = list.filter(entryIsActive);
  const summary = calculateDaySummary(rowsFromUiEntries(list as UiEntryLike[]));
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

export function summaryMonthFromEntries(
  entries: AnalyticsEntry[],
  businessId: string,
  month: string,
): AnalyticsTotals {
  return summarizeEntries(entriesInPeriod(entries, businessId, "month", "", month));
}

export function summaryDayFromEntries(
  entries: AnalyticsEntry[],
  businessId: string,
  date: string,
  formatDayLabel?: FormatDayLabelFn,
): AnalyticsDaySummaryRow {
  const format: FormatDayLabelFn = typeof formatDayLabel === "function"
    ? formatDayLabel
    : (value) => value;
  return {
    id: date,
    dayAr: format(date, "ar"),
    dayEn: format(date, "en"),
    fullAr: format(date, "ar"),
    fullEn: format(date, "en"),
    ...summarizeEntries(entriesInPeriod(entries, businessId, "day", date, date.slice(0, 7))),
  };
}

export function newestEntries(entries: AnalyticsEntry[]): AnalyticsEntry[] {
  return [...(Array.isArray(entries) ? entries : [])].sort(
    (a, b) => `${b.date}|${b.createdAt || ""}`.localeCompare(`${a.date}|${a.createdAt || ""}`),
  );
}

export function aggregateSalesChannelsFromGroupEntries(
  entries: AnalyticsEntry[],
  channelFilter = "all",
  resolveChannelName: ResolveChannelNameFn = (row) => row.name || row.channelId || "",
  configuredChannels: Array<Record<string, unknown>> = [],
): AnalyticsSalesChannelRow[] {
  const map = new Map<string, AnalyticsSalesChannelRow>();
  (Array.isArray(entries) ? entries : []).filter(entryIsActive).forEach((entry) => {
    if (entry.type !== "summary") return;
    (entry.salesChannels || []).forEach((row) => {
      if (!row?.channelId || Number(row.amount) <= 0) return;
      const resolvedName = sanitizeCloseoutChannelDisplayName(
        resolveChannelName(row),
        sanitizeCloseoutChannelDisplayName(row.name, ""),
      );
      const mapKey = resolveRegisterIncomeSourceFilterKey(row, configuredChannels)
        || String(row.channelId);
      const current = map.get(mapKey) || {
        channelId: String(row.channelId),
        name: resolvedName,
        amount: 0,
      };
      map.set(mapKey, {
        ...current,
        channelId: current.channelId || String(row.channelId),
        name: current.name || resolvedName,
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

export function aggregateChannels(
  entries: AnalyticsEntry[],
  businessId: string,
  period: string,
  selectedDate: string,
  selectedMonth: string,
  baseChannels: Array<Record<string, unknown> & { id?: string; amount?: number }> = [],
): Array<Record<string, unknown> & { amount: number }> {
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
      amount: addUiAmounts(Number(current.amount || 0), Number(row.amount || 0)),
    });
  }));
  return [...mapped.values()].filter((channel) => Number(channel.amount) > 0);
}

export function entryTotalsHaveFinancialActivity(totals: AnalyticsTotals | null | undefined): boolean {
  if (!totals || typeof totals !== "object") return false;
  return (Number(totals.sales) || 0) > 0 || (Number(totals.expense) || 0) > 0;
}

export function entryTotalsHaveActivity(totals: AnalyticsTotals | null | undefined): boolean {
  if (!totals || typeof totals !== "object") return false;
  return entryTotalsHaveFinancialActivity(totals)
    || (Number(totals.proofs) || 0) > 0;
}

export function preferLocalTotalsOverEmptyApi(
  localTotals: AnalyticsTotals,
  apiTotals: AnalyticsTotals | null | undefined,
): AnalyticsTotals {
  if (!apiTotals) return localTotals;
  if (entryTotalsHaveFinancialActivity(localTotals) && !entryTotalsHaveFinancialActivity(apiTotals)) {
    return localTotals;
  }
  return apiTotals;
}

export function resolveOwnerPeriodSummaryPreference({
  localTotals,
  apiTotals,
  entriesLoading = false,
  entriesDbSource = isEntriesApiDbSourceMode(),
}: ResolveOwnerPeriodSummaryPreferenceInput): boolean {
  if (entriesDbSource) {
    return false;
  }
  if (entryTotalsHaveFinancialActivity(localTotals)) return true;
  if (entriesLoading) return true;
  return !entryTotalsHaveFinancialActivity(apiTotals);
}

export function resolveOwnerSingleStoreTotals(
  localTotals: AnalyticsTotals,
  apiTotals: AnalyticsTotals | null | undefined,
  preferEntryDerived: boolean,
  { entriesDbSource = isEntriesApiDbSourceMode() }: ResolveOwnerSingleStoreTotalsOptions = {},
): AnalyticsTotals {
  if (entriesDbSource) {
    if (apiTotals != null) return apiTotals;
    return { ...EMPTY_ANALYTICS_TOTALS };
  }
  return preferEntryDerived
    ? localTotals
    : preferLocalTotalsOverEmptyApi(localTotals, apiTotals);
}

export function buildBusinessesWithEntrySummaries({
  businesses = [],
  operationalEntries = [],
  monthly = false,
  selectedDate = "",
  selectedMonth = "",
}: BuildBusinessesWithEntrySummariesInput): AnalyticsBusinessRef[] {
  const periodKey = monthly ? "month" : "day";
  return businesses.map((business) => {
    const record = monthly
      ? summaryMonthFromEntries(operationalEntries, String(business.id), selectedMonth)
      : summarizeEntries(
        entriesInPeriod(operationalEntries, String(business.id), "day", selectedDate, selectedMonth),
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

export function duplicateSalesSignature(entries: Array<{ id?: string }> = []): string {
  return entries.map((entry) => String(entry.id)).sort().join("|");
}

export function duplicateSalesGroupKey(group: DuplicateSalesGroup): string {
  return `${group.businessId}|${group.date}`;
}
