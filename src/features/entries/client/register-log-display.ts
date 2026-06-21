import {
  sumUiAmounts,
  addUiAmounts,
  reconcileSummarySalesDisplayRiyals,
} from "@/domain/cash-movement/calculations";
import { resolveCloseoutOwnerEditMetaFromEntries } from "@/features/closeouts/client/closeout-owner-edit-display";
import {
  entryRowMatchesIncomeSourceFilter,
  resolveRegisterIncomeSourceFilterKey,
} from "@/features/org-config/client/sales-channel-display";
import {
  mergeRegisterConfiguredChannels,
  registerSalesChannelBadgeLabel,
} from "@/features/entries/client/register-channel-catalog";
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
import type { DisplayLang } from "@/core/i18n/display-locale";
import type {
  OperationalEntry,
  OperationalEntrySalesChannelRow,
  RegisterChannelOption,
  RegisterCloseoutGroup,
  RegisterLogFilters,
  RegisterReportRow,
} from "./entries-client-types";

export const DEFAULT_REGISTER_LOG_FILTERS: RegisterLogFilters = {
  status: "all",
  type: "all",
  expenseCategory: "all",
  attachmentOnly: false,
  actor: "all",
  salesChannel: "all",
};

export { mergeRegisterConfiguredChannels, registerSalesChannelBadgeLabel };

export function resolveRegisterCloseoutActorLabel(
  group: RegisterCloseoutGroup,
  { ownerUserId = "", lang = "ar" as DisplayLang, enteredByOwnerLabel = "المالك" } = {},
): string {
  const ownerEntered = (ownerUserId
    ? group.entries.find((entry) => entry.enteredBy?.userId === ownerUserId)
    : null)
    || group.entries.find((entry) => entry.enteredBy?.role === "owner")
    || group.entries[0];
  return employeeDisplayName(ownerEntered, lang) || enteredByOwnerLabel;
}

export function registerLogFilterCount(filters: RegisterLogFilters): number {
  return Number(filters.status !== "all")
    + Number(filters.type !== "all")
    + Number(filters.expenseCategory !== "all")
    + Number(filters.salesChannel !== "all")
    + Number(filters.attachmentOnly)
    + Number(filters.actor !== "all");
}

export function entryCategoryForLogFilter(entry: OperationalEntry): string {
  return entry.type === "purchases"
    ? "purchases"
    : entry.type === "withdrawal"
      ? "withdrawal"
      : (entry.categoryId || "other");
}

export function entryMatchesRegisterLogFilters(
  entry: OperationalEntry,
  filters: RegisterLogFilters,
  resolveExpenseCategory: (entry: OperationalEntry) => string = entryCategoryForLogFilter,
  configuredChannels: Array<Record<string, unknown>> = [],
): boolean {
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
  entries: OperationalEntry[],
  filters: RegisterLogFilters,
  resolveExpenseCategory: (entry: OperationalEntry) => string = entryCategoryForLogFilter,
  configuredChannels: Array<Record<string, unknown>> = [],
): OperationalEntry[] {
  return (Array.isArray(entries) ? entries : []).filter(
    (entry) => entryMatchesRegisterLogFilters(entry, filters, resolveExpenseCategory, configuredChannels),
  );
}

export function formatNetMarginOfSalesRatio(sales: number, net: number): string {
  const salesAmount = Number(sales) || 0;
  const netAmount = Number(net) || 0;
  if (salesAmount <= 0) return "—";
  return `${((netAmount / salesAmount) * 100).toFixed(1)}%`;
}

function buildRegisterDailyReportRows(entries: OperationalEntry[]): RegisterReportRow[] {
  const activeEntries = (Array.isArray(entries) ? entries : []).filter(entryIsActive);
  const dates = [...new Set(activeEntries.map((entry) => entry.date).filter(Boolean))].sort().reverse();
  return dates
    .map((date) => {
      const dayTotals = summarizeEntries(activeEntries.filter((entry) => entry.date === date));
      return {
        id: date!,
        date: date!,
        sales: dayTotals.sales,
        expense: dayTotals.expense,
        net: dayTotals.net,
      };
    })
    .filter((row) => row.sales > 0 || row.expense > 0);
}

export function applyRegisterReportGranularity(
  rows: RegisterReportRow[],
  granularity: string = REGISTER_REPORT_GRANULARITY.DAY,
): RegisterReportRow[] {
  if (granularity !== REGISTER_REPORT_GRANULARITY.MONTH) {
    return Array.isArray(rows) ? rows : [];
  }

  const monthMap = new Map<string, RegisterReportRow>();
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
  entries: OperationalEntry[],
  { granularity = REGISTER_REPORT_GRANULARITY.DAY }: { granularity?: string } = {},
): RegisterReportRow[] {
  const dailyRows = buildRegisterDailyReportRows(entries);
  return applyRegisterReportGranularity(dailyRows, granularity);
}

export function buildRegisterDayReportRows(entries: OperationalEntry[]): RegisterReportRow[] {
  return buildRegisterReportRows(entries, { granularity: REGISTER_REPORT_GRANULARITY.DAY });
}

export function buildRegisterReportExportRows({
  entries = [],
  granularity = REGISTER_REPORT_GRANULARITY.DAY,
  withStore = false,
  formatStore = (_businessId: string) => "",
}: {
  entries?: OperationalEntry[];
  granularity?: string;
  withStore?: boolean;
  formatStore?: (businessId: string) => string;
} = {}): RegisterReportRow[] {
  const activeEntries = (Array.isArray(entries) ? entries : []).filter(entryIsActive);
  if (!withStore) {
    return buildRegisterReportRows(activeEntries, { granularity });
  }

  const keys = new Set<string>();
  activeEntries.forEach((entry) => {
    const periodKey = granularity === REGISTER_REPORT_GRANULARITY.MONTH
      ? (entry.date || "").slice(0, 7)
      : (entry.date || "");
    keys.add(`${entry.businessId}|${periodKey}`);
  });

  return [...keys]
    .map((key) => {
      const [businessId, periodKey] = key.split("|");
      const scoped = activeEntries.filter((entry) => {
        if (entry.businessId !== businessId) return false;
        return granularity === REGISTER_REPORT_GRANULARITY.MONTH
          ? (entry.date || "").startsWith(periodKey)
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

export type RegisterPeriodSummary =
  | { mode: "channel"; label: string; amount: number }
  | { mode: "totals"; sales: number; expense: number; net: number };

export function summarizeRegisterPeriod(
  entries: OperationalEntry[],
  salesChannelFilter: string,
  channelOptions: RegisterChannelOption[] = [],
  channelLabelFallback = "Channel",
  configuredChannels: Array<Record<string, unknown>> = [],
): RegisterPeriodSummary {
  const activeEntries = (Array.isArray(entries) ? entries : []).filter(entryIsActive);
  if (salesChannelFilter !== "all") {
    const option = channelOptions.find((item) => item.id === salesChannelFilter);
    const channelAmounts: number[] = [];
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
  periodEntries: OperationalEntry[],
  resolveChannelLabel: (row: OperationalEntrySalesChannelRow) => string,
  allChannelsLabel: string,
  configuredChannels: Array<Record<string, unknown>> = [],
): RegisterChannelOption[] {
  const seen = new Set<string>();
  const options: RegisterChannelOption[] = [{ id: "all", label: allChannelsLabel }];
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

export type RegisterCloseoutSummary = RegisterCloseoutGroup & {
  store: Record<string, unknown> | null;
  totals: { sales: number; expense: number; net: number };
  salesChannels: Array<{ channelId?: string; amount: number; label?: string; name?: string }>;
  displaySales: number;
  operations: OperationalEntry[];
  actorLabel: string;
  daySequence: number | null;
  ownerEditedAt: string | null;
  ownerEditedByUserId: string | null;
  ownerEditedByName: string | null;
  sameDayCloseoutCount?: number;
};

export function buildRegisterCloseoutSummaries({
  filteredEntries = [],
  salesChannelFilter = "all",
  configuredChannels = [],
  resolveChannelName,
  resolveStore,
  resolveActorLabel = (_group: RegisterCloseoutGroup) => "",
}: {
  filteredEntries?: OperationalEntry[];
  salesChannelFilter?: string;
  configuredChannels?: Array<Record<string, unknown>>;
  resolveChannelName: (row: OperationalEntrySalesChannelRow) => string;
  resolveStore: (businessId: string) => Record<string, unknown> | null;
  resolveActorLabel?: (group: RegisterCloseoutGroup) => string;
}): RegisterCloseoutSummary[] {
  const grouped = new Map<string, RegisterCloseoutGroup>();
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
    grouped.get(key)!.entries.push(entry);
  });

  const summaries = [...grouped.values()].map((group) => {
    const store = resolveStore(group.businessId || "");
    const totals = summarizeEntries(group.entries);
    const salesChannels = aggregateSalesChannelsFromGroupEntries(
      group.entries,
      salesChannelFilter,
      resolveChannelName,
      configuredChannels,
    );
    const channelSalesTotal = sumUiAmounts(salesChannels.map((row) => row.amount));
    const displaySales = salesChannelFilter === "all"
      ? reconcileSummarySalesDisplayRiyals(totals.sales, salesChannels.map((row) => row.amount))
      : channelSalesTotal;
    const displayNet = addUiAmounts(displaySales, -totals.expense);
    const daySequence = group.entries.find((entry) => Number.isInteger(entry.daySequence))?.daySequence ?? null;
    const ownerEditMeta = resolveCloseoutOwnerEditMetaFromEntries(group.entries);
    return {
      ...group,
      store,
      totals: salesChannelFilter === "all"
        ? { ...totals, sales: displaySales, net: displayNet }
        : totals,
      salesChannels,
      displaySales,
      operations: newestEntries(group.entries),
      actorLabel: resolveActorLabel(group),
      daySequence,
      ownerEditedAt: ownerEditMeta?.ownerEditedAt || null,
      ownerEditedByUserId: ownerEditMeta?.ownerEditedByUserId || null,
      ownerEditedByName: ownerEditMeta?.ownerEditedByName || null,
    };
  });

  const sameDayCloseoutCountByStoreDate = new Map<string, number>();
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
      if (a.date !== b.date) return (b.date || "").localeCompare(a.date || "");
      const aStamp = `${a.date}|${a.operations[0]?.createdAt || ""}`;
      const bStamp = `${b.date}|${b.operations[0]?.createdAt || ""}`;
      return bStamp.localeCompare(aStamp);
    });
}
