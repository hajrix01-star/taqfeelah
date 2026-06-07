import {
  filterSummaryChannelRows,
  summaryEntryDisplayAmount,
  summarySalesChannelLabel as buildSummarySalesChannelLabel,
} from "@/features/entries/client/register-operation-display";
import {
  channelName,
  channels,
  expenseCategories,
  text,
} from "./prototype-runtime-demo-data";

const noteLabel = (entry, lang) => {
  if (entry.type === "summary") return summarySalesChannelLabel(entry, lang);
  if (entry.noteKey) return text(lang, entry.noteKey);
  return entry.note || text(lang, entry.type);
};
const entryCategory = (entry) => entry.type === "purchases" ? "purchases" : entry.type === "withdrawal" ? "withdrawal" : (entry.categoryId || "other");
function resolveSummaryChannelName(row, lang) {
  const fallback = channels.find((channel) => channel.id === row.channelId);
  return row.name || (fallback ? channelName(fallback, lang) : row.channelId);
}
function summarySalesChannelLabel(entry, lang, salesChannelFilter = "all") {
  return buildSummarySalesChannelLabel(
    entry,
    (row) => resolveSummaryChannelName(row, lang),
    salesChannelFilter,
    text(lang, "summary"),
  );
}
const operationDisplayLabel = (entry, lang, salesChannelFilter = "all") => {
  if (entry.type === "expense") return text(lang, expenseCategories.find((item) => item.id === entryCategory(entry))?.label || "other");
  if (entry.type === "summary") return summarySalesChannelLabel(entry, lang, salesChannelFilter);
  return text(lang, entry.type);
};
function expandRegisterCloseoutOperationRows(item, lang, salesChannelFilter = "all") {
  if (item.type !== "summary") {
    return [{ key: item.id, item, label: operationDisplayLabel(item, lang, salesChannelFilter), amount: signedEntryAmount(item), isSale: false }];
  }
  const rows = filterSummaryChannelRows(item, salesChannelFilter);
  if (!rows.length) {
    return [{ key: item.id, item, label: summarySalesChannelLabel(item, lang, salesChannelFilter), amount: summaryEntryDisplayAmount(item, salesChannelFilter), isSale: true }];
  }
  return rows.map((row, index) => {
    const fallback = channels.find((channel) => channel.id === row.channelId);
    const label = row.name || (fallback ? channelName(fallback, lang) : row.channelId);
    return { key: `${item.id}-${row.channelId}-${index}`, item, label, amount: Number(row.amount), isSale: true };
  });
}
const signedEntryAmount = (entry) => entry.type === "summary" ? entry.amount : -entry.amount;
const entryWasRestored = (entry) => Boolean(entry.restoredAt);
const entryDateMatches = (entry, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo) => {
  if (period === "day") return entry.date === selectedDate;
  if (period === "month") return entry.date.startsWith(monthSelectionValue(selectedMonth));
  if (period === "year") return entry.date.startsWith(`${selectedYear}-`);
  return entry.date >= customFrom && entry.date <= customTo;
};

export const entryHasAttachment = (entry) => Boolean(entry.attachment);
export const entryIsVoided = (entry) => entry.status === "voided";
export {
  noteLabel,
  entryCategory,
  resolveSummaryChannelName,
  summarySalesChannelLabel,
  operationDisplayLabel,
  expandRegisterCloseoutOperationRows,
  signedEntryAmount,
  entryWasRestored,
  entryDateMatches,
};
