import { sumUiAmounts } from "@/domain/cash-movement/calculations";
import {
  entryDateMatches,
  entryIsActive,
  entryIsOutflow,
  monthSelectionValue,
  newestEntries,
  summarizeEntries,
} from "@/features/operations/operational-analytics";
import type { OperationalEntry } from "@/features/entries/client/entries-client-types";
import type { FilterOutflowEntriesForPeriodInput, UiDayReportRow } from "@/features/reports/client/reports-client-types";
import { formatCalendarDate } from "./report-period-labels";

export function entryCategoryForReports(entry: OperationalEntry): string {
  return entry.type === "purchases"
    ? "purchases"
    : entry.type === "withdrawal"
      ? "withdrawal"
      : (entry.categoryId || "other");
}

export function buildLocalReportDaysFromEntries(
  entries: OperationalEntry[],
  selectedMonth: string,
): UiDayReportRow[] {
  const scopedEntries = Array.isArray(entries) ? entries : [];
  const monthPrefix = monthSelectionValue(selectedMonth);
  const dates = [...new Set(
    scopedEntries
      .filter((entry) => entryIsActive(entry) && entry.type === "summary" && String(entry.date).startsWith(monthPrefix))
      .map((entry) => String(entry.date)),
  )].sort().reverse();

  return dates.map((date) => ({
    id: date,
    dayAr: formatCalendarDate(date, "ar"),
    dayEn: formatCalendarDate(date, "en"),
    ...summarizeEntries(scopedEntries.filter((entry) => entry.date === date)),
  }));
}

export function filterOutflowEntriesForPeriod({
  entries = [],
  selectedBusiness = "all",
  category = "all",
  period,
  selectedDate,
  selectedMonth,
  selectedYear,
  customFrom,
  customTo,
  businessIds = null,
  resolveCategory = entryCategoryForReports,
}: FilterOutflowEntriesForPeriodInput): OperationalEntry[] {
  const allowedBusinessIds = businessIds
    || (selectedBusiness === "all" ? null : [selectedBusiness]);

  return (Array.isArray(entries) ? entries : []).filter((entry) => {
    if (!entryIsActive(entry) || !entryIsOutflow(entry)) return false;
    if (allowedBusinessIds && !allowedBusinessIds.includes(String(entry.businessId))) return false;
    if (selectedBusiness !== "all" && entry.businessId !== selectedBusiness) return false;
    if (category !== "all" && resolveCategory(entry) !== category) return false;
    return entryDateMatches(entry, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo);
  });
}

export function computeOutflowAnalysisMetrics(
  records: OperationalEntry[] = [],
  apiTotal: number | null = null,
  apiCount: number | null = null,
): {
  visibleRecords: OperationalEntry[];
  total: number;
  count: number;
  average: number;
} {
  const visibleRecords = Array.isArray(records) ? records : [];
  const total = typeof apiTotal === "number"
    ? apiTotal
    : sumUiAmounts(visibleRecords.map((record) => Number(record.amount || 0)));
  const count = typeof apiCount === "number" ? apiCount : visibleRecords.length;
  const average = count > 0 ? total / count : 0;
  return { visibleRecords, total, count, average };
}

export function buildOutflowByCategoryFromEntries(
  periodEntries: OperationalEntry[],
  categoryDefinitions: Array<Record<string, unknown> & { id?: string; amount?: number }> = [],
  resolveCategory: (entry: OperationalEntry) => string = entryCategoryForReports,
): Array<Record<string, unknown> & { id?: string; amount: number }> {
  return categoryDefinitions
    .filter((item) => item.id !== "all")
    .map((item) => ({
      ...item,
      amount: sumUiAmounts(
        (Array.isArray(periodEntries) ? periodEntries : [])
          .filter((entry) => entryIsActive(entry) && entryIsOutflow(entry) && resolveCategory(entry) === item.id)
          .map((entry) => Number(entry.amount || 0)),
      ),
    }))
    .filter((item) => item.amount > 0);
}

export function percentageOfSalesAmount(amount: number, salesBase: number): string {
  return salesBase > 0
    ? `${((amount / salesBase) * 100).toFixed(1)}%`
    : amount > 0
      ? "—"
      : "0.0%";
}

export function sortNewestEntries(entries: OperationalEntry[]): OperationalEntry[] {
  return newestEntries(entries);
}
