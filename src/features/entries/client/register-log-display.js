import { sumUiAmounts, addUiAmounts } from "@/domain/cash-movement/calculations";
import { resolveCloseoutOwnerEditMetaFromEntries } from "@/features/closeouts/client/closeout-owner-edit-display";
import {
  entryRowMatchesIncomeSourceFilter,
  resolveRegisterIncomeSourceFilterKey,
} from "@/features/org-config/client/sales-channel-display";
import { employeeDisplayName } from "@/features/employee-closeouts/employee-entries-display";
import {
  aggregateSalesChannelsFromGroupEntries,
  entryHasAttachment,
  entryIsActive,
  entryIsVoided,
  newestEntries,
  summarizeEntries,
} from "@/features/operations/operational-analytics";
import { REGISTER_REPORT_GRANULARITY } from "@/features/reports/client/register-report-granularity";

export const DEFAULT_REGISTER_LOG_FILTERS = {
  status: "all",
  type: "all",
  expenseCategory: "all",
  attachmentOnly: false,
  actor: "all",
  salesChannel: "all",
};

/**
 * @param {{ entries: Array<object> }} group
 * @param {{ ownerUserId?: string, lang?: "ar" | "en", enteredByOwnerLabel?: string }} [options]
 */
export function resolveRegisterCloseoutActorLabel(
  group,
  { ownerUserId = "", lang = "ar", enteredByOwnerLabel = "المالك" } = {},
) {
  const ownerEntered = (ownerUserId
    ? group.entries.find((entry) => entry.enteredBy?.userId === ownerUserId)
    : null)
    || group.entries.find((entry) => entry.enteredBy?.role === "owner")
    || group.entries[0];
  return employeeDisplayName(ownerEntered, lang) || enteredByOwnerLabel;
}

export function registerLogFilterCount(filters) {
  return Number(filters.status !== "all")
    + Number(filters.type !== "all")
    + Number(filters.expenseCategory !== "all")
    + Number(filters.salesChannel !== "all")
    + Number(filters.attachmentOnly)
    + Number(filters.actor !== "all");
}

export function entryCategoryForLogFilter(entry) {
  return entry.type === "purchases"
    ? "purchases"
    : entry.type === "withdrawal"
      ? "withdrawal"
      : (entry.categoryId || "other");
}

export function entryMatchesRegisterLogFilters(
  entry,
  filters,
  resolveExpenseCategory = entryCategoryForLogFilter,
  configuredChannels = [],
) {
  const matchesStatus = filters.status === "all"
    || (filters.status === "active" ? entryIsActive(entry) : entryIsVoided(entry));
  const matchesType = filters.type === "all" || entry.type === filters.type;
  const matchesExpenseCategory = filters.type !== "expense"
    || filters.expenseCategory === "all"
    || (entry.type === "expense" && resolveExpenseCategory(entry) === filters.expenseCategory);
  const matchesActor = filters.actor === "all" || entry.enteredBy?.userId === filters.actor;
  const matchesSalesChannel = filters.salesChannel === "all"
    || (entry.type === "summary"
      && (entry.salesChannels || []).some(
        (row) => Number(row.amount) > 0
          && entryRowMatchesIncomeSourceFilter(row, filters.salesChannel, configuredChannels),
      ));
  const matchesAttachment = !filters.attachmentOnly || entryHasAttachment(entry);

  return matchesStatus
    && matchesType
    && matchesExpenseCategory
    && matchesActor
    && matchesSalesChannel
    && matchesAttachment;
}

export function filterRegisterLogEntries(
  entries,
  filters,
  resolveExpenseCategory = entryCategoryForLogFilter,
  configuredChannels = [],
) {
  return (Array.isArray(entries) ? entries : []).filter(
    (entry) => entryMatchesRegisterLogFilters(entry, filters, resolveExpenseCategory, configuredChannels),
  );
}

/** Net margin as % of sales (نسبة الناتج من الداخل). */
export function formatNetMarginOfSalesRatio(sales, net) {
  const salesAmount = Number(sales) || 0;
  const netAmount = Number(net) || 0;
  if (salesAmount <= 0) return "—";
  return `${((netAmount / salesAmount) * 100).toFixed(1)}%`;
}

/** Daily in/out/net rows for register general report (unfiltered period entries). */
function buildRegisterDailyReportRows(entries) {
  const activeEntries = (Array.isArray(entries) ? entries : []).filter(entryIsActive);
  const dates = [...new Set(activeEntries.map((entry) => entry.date).filter(Boolean))].sort().reverse();
  return dates
    .map((date) => {
      const dayTotals = summarizeEntries(activeEntries.filter((entry) => entry.date === date));
      return {
        id: date,
        date,
        sales: dayTotals.sales,
        expense: dayTotals.expense,
        net: dayTotals.net,
      };
    })
    .filter((row) => row.sales > 0 || row.expense > 0);
}

export function applyRegisterReportGranularity(
  rows,
  granularity = REGISTER_REPORT_GRANULARITY.DAY,
) {
  if (granularity !== REGISTER_REPORT_GRANULARITY.MONTH) {
    return Array.isArray(rows) ? rows : [];
  }

  const monthMap = new Map();
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const monthKey = String(row.date || row.id || "").slice(0, 7);
    if (!monthKey) return;
    const current = monthMap.get(monthKey) || {
      id: monthKey,
      date: monthKey,
      sales: 0,
      expense: 0,
      net: 0,
    };
    monthMap.set(monthKey, {
      id: monthKey,
      date: monthKey,
      sales: addUiAmounts(current.sales, Number(row.sales) || 0),
      expense: addUiAmounts(current.expense, Number(row.expense) || 0),
      net: addUiAmounts(current.net, Number(row.net) || 0),
    });
  });

  return [...monthMap.values()]
    .filter((row) => row.sales > 0 || row.expense > 0)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function buildRegisterReportRows(
  entries,
  { granularity = REGISTER_REPORT_GRANULARITY.DAY } = {},
) {
  const dailyRows = buildRegisterDailyReportRows(entries);
  return applyRegisterReportGranularity(dailyRows, granularity);
}

export function buildRegisterDayReportRows(entries) {
  return buildRegisterReportRows(entries, { granularity: REGISTER_REPORT_GRANULARITY.DAY });
}

/**
 * Builds register general-report rows for export from scoped entries.
 * Supports optional store column for combined exports.
 */
export function buildRegisterReportExportRows({
  entries = [],
  granularity = REGISTER_REPORT_GRANULARITY.DAY,
  withStore = false,
  formatStore = () => "",
} = {}) {
  const activeEntries = (Array.isArray(entries) ? entries : []).filter(entryIsActive);
  if (!withStore) {
    return buildRegisterReportRows(activeEntries, { granularity });
  }

  const keys = new Set();
  activeEntries.forEach((entry) => {
    const periodKey = granularity === REGISTER_REPORT_GRANULARITY.MONTH
      ? entry.date.slice(0, 7)
      : entry.date;
    keys.add(`${entry.businessId}|${periodKey}`);
  });

  return [...keys]
    .map((key) => {
      const [businessId, periodKey] = key.split("|");
      const scoped = activeEntries.filter((entry) => {
        if (entry.businessId !== businessId) return false;
        return granularity === REGISTER_REPORT_GRANULARITY.MONTH
          ? entry.date.startsWith(periodKey)
          : entry.date === periodKey;
      });
      const totals = summarizeEntries(scoped);
      return {
        store: formatStore(businessId),
        date: periodKey,
        sales: totals.sales,
        expense: totals.expense,
        net: totals.net,
      };
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export function summarizeRegisterPeriod(
  entries,
  salesChannelFilter,
  channelOptions = [],
  channelLabelFallback = "Channel",
  configuredChannels = [],
) {
  const activeEntries = (Array.isArray(entries) ? entries : []).filter(entryIsActive);
  if (salesChannelFilter !== "all") {
    const option = channelOptions.find((item) => item.id === salesChannelFilter);
    const channelAmounts = [];
    activeEntries.forEach((entry) => {
      if (entry.type !== "summary") return;
      (entry.salesChannels || []).forEach((row) => {
        if (entryRowMatchesIncomeSourceFilter(row, salesChannelFilter, configuredChannels)) {
          channelAmounts.push(Number(row.amount) || 0);
        }
      });
    });
    return {
      mode: "channel",
      label: option?.label || channelLabelFallback,
      amount: sumUiAmounts(channelAmounts),
    };
  }
  const totals = summarizeEntries(entries);
  return { mode: "totals", sales: totals.sales, expense: totals.expense, net: totals.net };
}

export function buildRegisterSalesChannelOptions(
  periodEntries,
  resolveChannelLabel,
  allChannelsLabel,
  configuredChannels = [],
) {
  const seen = new Set();
  const options = [{ id: "all", label: allChannelsLabel }];
  (Array.isArray(periodEntries) ? periodEntries : []).forEach((entry) => {
    if (entry.type !== "summary") return;
    (entry.salesChannels || []).forEach((row) => {
      if (!row?.channelId || Number(row.amount) <= 0) return;
      const filterKey = resolveRegisterIncomeSourceFilterKey(row, configuredChannels);
      if (!filterKey || seen.has(filterKey)) return;
      seen.add(filterKey);
      options.push({
        id: filterKey,
        label: resolveChannelLabel(row),
      });
    });
  });
  return options;
}

/** @param {{ filteredEntries?: object[], salesChannelFilter?: string, configuredChannels?: object[], resolveChannelName?: (row: object) => string, resolveStore?: (businessId: string) => object | null, resolveActorLabel?: (group: object) => string }} params */
export function buildRegisterCloseoutSummaries({
  filteredEntries = [],
  salesChannelFilter = "all",
  configuredChannels = [],
  resolveChannelName,
  resolveStore,
  resolveActorLabel = () => "",
}) {
  const grouped = new Map();
  newestEntries(filteredEntries).forEach((entry) => {
    const key = entry.closeoutId
      ? `closeout|${entry.closeoutId}`
      : `legacy-day|${entry.businessId}|${entry.date}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        businessId: entry.businessId,
        closeoutId: entry.closeoutId || null,
        date: entry.date,
        entries: [],
      });
    }
    grouped.get(key).entries.push(entry);
  });

  const summaries = [...grouped.values()].map((group) => {
    const store = resolveStore(group.businessId);
    const totals = summarizeEntries(group.entries);
    const salesChannels = aggregateSalesChannelsFromGroupEntries(
      group.entries,
      salesChannelFilter,
      resolveChannelName,
      configuredChannels,
    );
    const channelSalesTotal = sumUiAmounts(salesChannels.map((row) => row.amount));
    const daySequence = group.entries.find((entry) => Number.isInteger(entry.daySequence))?.daySequence ?? null;
    const ownerEditMeta = resolveCloseoutOwnerEditMetaFromEntries(group.entries);
    return {
      ...group,
      store,
      totals,
      salesChannels,
      displaySales: salesChannelFilter === "all" ? totals.sales : channelSalesTotal,
      operations: newestEntries(group.entries),
      actorLabel: resolveActorLabel(group),
      daySequence,
      ownerEditedAt: ownerEditMeta?.ownerEditedAt || null,
      ownerEditedByUserId: ownerEditMeta?.ownerEditedByUserId || null,
      ownerEditedByName: ownerEditMeta?.ownerEditedByName || null,
    };
  });

  const sameDayCloseoutCountByStoreDate = new Map();
  summaries.forEach((summary) => {
    if (!summary.closeoutId) return;
    const key = `${summary.businessId}|${summary.date}`;
    sameDayCloseoutCountByStoreDate.set(key, (sameDayCloseoutCountByStoreDate.get(key) || 0) + 1);
  });

  return summaries
    .map((summary) => ({
      ...summary,
      sameDayCloseoutCount: summary.closeoutId
        ? sameDayCloseoutCountByStoreDate.get(`${summary.businessId}|${summary.date}`) || 1
        : 1,
    }))
    .filter((group) => salesChannelFilter === "all" || group.salesChannels.length > 0)
    .sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      const aStamp = `${a.date}|${a.operations[0]?.createdAt || ""}`;
      const bStamp = `${b.date}|${b.operations[0]?.createdAt || ""}`;
      return bStamp.localeCompare(aStamp);
    });
}
