import {
  entryDateMatches,
  entryIsActive,
  entryIsOutflow,
  monthSelectionValue,
  newestEntries,
  summarizeEntries,
} from "@/features/operations/operational-analytics";
import { formatCalendarDate } from "./report-period-labels";

export function entryCategoryForReports(entry) {
  return entry.type === "purchases"
    ? "purchases"
    : entry.type === "withdrawal"
      ? "withdrawal"
      : (entry.categoryId || "other");
}

export function buildLocalReportDaysFromEntries(entries, selectedMonth, reviewEnabledForBusiness = () => false) {
  const scopedEntries = Array.isArray(entries) ? entries : [];
  const monthPrefix = monthSelectionValue(selectedMonth);
  const dates = [...new Set(
    scopedEntries
      .filter((entry) => entryIsActive(entry) && entry.type === "summary" && entry.date.startsWith(monthPrefix))
      .map((entry) => entry.date),
  )].sort().reverse();

  return dates.map((date) => ({
    id: date,
    dayAr: formatCalendarDate(date, "ar"),
    dayEn: formatCalendarDate(date, "en"),
    ...summarizeEntries(
      scopedEntries.filter((entry) => entry.date === date),
      reviewEnabledForBusiness,
    ),
  }));
}

/** @param {{ entries?: object[], selectedBusiness?: string, category?: string, period: string, selectedDate: string, selectedMonth: string, selectedYear: string, customFrom: string, customTo: string, businessIds?: string[] | null, resolveCategory?: (entry: object) => string }} params */
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
}) {
  const allowedBusinessIds = businessIds
    || (selectedBusiness === "all" ? null : [selectedBusiness]);

  return (Array.isArray(entries) ? entries : []).filter((entry) => {
    if (!entryIsActive(entry) || !entryIsOutflow(entry)) return false;
    if (allowedBusinessIds && !allowedBusinessIds.includes(entry.businessId)) return false;
    if (selectedBusiness !== "all" && entry.businessId !== selectedBusiness) return false;
    if (category !== "all" && resolveCategory(entry) !== category) return false;
    return entryDateMatches(entry, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo);
  });
}

export function computeOutflowAnalysisMetrics(records = [], apiTotal = null, apiCount = null) {
  const visibleRecords = Array.isArray(records) ? records : [];
  const total = typeof apiTotal === "number"
    ? apiTotal
    : visibleRecords.reduce((sum, record) => sum + record.amount, 0);
  const count = typeof apiCount === "number" ? apiCount : visibleRecords.length;
  const average = count > 0 ? total / count : 0;
  return { visibleRecords, total, count, average };
}

export function buildOutflowByCategoryFromEntries(periodEntries, categoryDefinitions = [], resolveCategory = entryCategoryForReports) {
  return categoryDefinitions
    .filter((item) => item.id !== "all")
    .map((item) => ({
      ...item,
      amount: (Array.isArray(periodEntries) ? periodEntries : [])
        .filter((entry) => entryIsActive(entry) && entryIsOutflow(entry) && resolveCategory(entry) === item.id)
        .reduce((sum, entry) => sum + entry.amount, 0),
    }))
    .filter((item) => item.amount > 0);
}

export function percentageOfSalesAmount(amount, salesBase) {
  return salesBase > 0
    ? `${((amount / salesBase) * 100).toFixed(1)}%`
    : amount > 0
      ? "—"
      : "0.0%";
}

export function sortNewestEntries(entries) {
  return newestEntries(entries);
}
