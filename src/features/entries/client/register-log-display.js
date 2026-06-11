import { sumUiAmounts } from "@/domain/cash-movement/calculations";
import { resolveCloseoutOwnerEditMetaFromEntries } from "@/features/closeouts/client/closeout-owner-edit-display";
import {
  aggregateSalesChannelsFromGroupEntries,
  entryHasAttachment,
  entryIsActive,
  entryIsVoided,
  newestEntries,
  summarizeEntries,
} from "@/features/operations/operational-analytics";

export const DEFAULT_REGISTER_LOG_FILTERS = {
  status: "all",
  type: "all",
  expenseCategory: "all",
  attachmentOnly: false,
  actor: "all",
  salesChannel: "all",
};

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

export function entryMatchesRegisterLogFilters(entry, filters, resolveExpenseCategory = entryCategoryForLogFilter) {
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
        (row) => row.channelId === filters.salesChannel && Number(row.amount) > 0,
      ));
  const matchesAttachment = !filters.attachmentOnly || entryHasAttachment(entry);

  return matchesStatus
    && matchesType
    && matchesExpenseCategory
    && matchesActor
    && matchesSalesChannel
    && matchesAttachment;
}

export function filterRegisterLogEntries(entries, filters, resolveExpenseCategory = entryCategoryForLogFilter) {
  return (Array.isArray(entries) ? entries : []).filter(
    (entry) => entryMatchesRegisterLogFilters(entry, filters, resolveExpenseCategory),
  );
}

export function summarizeRegisterPeriod(entries, salesChannelFilter, channelOptions = [], channelLabelFallback = "Channel") {
  const activeEntries = (Array.isArray(entries) ? entries : []).filter(entryIsActive);
  if (salesChannelFilter !== "all") {
    const option = channelOptions.find((item) => item.id === salesChannelFilter);
    const channelAmounts = [];
    activeEntries.forEach((entry) => {
      if (entry.type !== "summary") return;
      (entry.salesChannels || []).forEach((row) => {
        if (row.channelId === salesChannelFilter) {
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

export function buildRegisterSalesChannelOptions(periodEntries, resolveChannelLabel, allChannelsLabel) {
  const seen = new Set();
  const options = [{ id: "all", label: allChannelsLabel }];
  (Array.isArray(periodEntries) ? periodEntries : []).forEach((entry) => {
    if (entry.type !== "summary") return;
    (entry.salesChannels || []).forEach((row) => {
      if (!row?.channelId || seen.has(row.channelId)) return;
      seen.add(row.channelId);
      options.push({
        id: row.channelId,
        label: resolveChannelLabel(row),
      });
    });
  });
  return options;
}

/** @param {{ filteredEntries?: object[], salesChannelFilter?: string, resolveChannelName?: (row: object) => string, resolveStore?: (businessId: string) => object | null, resolveActorLabel?: (group: object) => string }} params */
export function buildRegisterCloseoutSummaries({
  filteredEntries = [],
  salesChannelFilter = "all",
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
