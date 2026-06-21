import {
  filterSummaryChannelRows,
  summaryEntryDisplayAmount,
  summarySalesChannelLabel as buildSummarySalesChannelLabel,
} from "@/features/entries/client/register-operation-display";
import {
  entryDateMatches,
  entryIsActive,
  entryIsOutflow,
} from "@/features/operations/operational-analytics";
import { resolveSalesChannelRowLabel } from "@/features/org-config/client/sales-channel-display";
import {
  channelName,
  channels,
  expenseCategories,
  text,
} from "./prototype-runtime-demo-data";
import type { OperationalEntry, PrototypeChannel, PrototypeLang } from "./prototype-runtime-types";

const noteLabel = (entry: OperationalEntry, lang: PrototypeLang) => {
  if (entry.type === "summary") return summarySalesChannelLabel(entry, lang);
  if (entry.noteKey) return text(lang, entry.noteKey);
  return entry.note || text(lang, entry.type || "");
};
const entryCategory = (entry: OperationalEntry) => entry.type === "purchases" ? "purchases" : entry.type === "withdrawal" ? "withdrawal" : (entry.categoryId || "other");
function resolveSummaryChannelName(row: Record<string, unknown>, lang: PrototypeLang) {
  return resolveSalesChannelRowLabel(row, channels, lang, channelName);
}
function summarySalesChannelLabel(entry: OperationalEntry, lang: PrototypeLang, salesChannelFilter = "all") {
  return buildSummarySalesChannelLabel(
    entry,
    (row) => resolveSummaryChannelName(row, lang),
    salesChannelFilter,
    text(lang, "summary"),
  );
}
const operationDisplayLabel = (entry: OperationalEntry, lang: PrototypeLang, salesChannelFilter = "all") => {
  if (entry.type === "expense") return text(lang, expenseCategories.find((item) => item.id === entryCategory(entry))?.label || "other");
  if (entry.type === "summary") return summarySalesChannelLabel(entry, lang, salesChannelFilter);
  return text(lang, entry.type || "");
};
function expandRegisterCloseoutOperationRows(item: OperationalEntry, lang: PrototypeLang, salesChannelFilter = "all") {
  if (item.type !== "summary") {
    return [{ key: item.id || "", item, label: operationDisplayLabel(item, lang, salesChannelFilter), amount: signedEntryAmount(item), isSale: false }];
  }
  const rows = filterSummaryChannelRows(item, salesChannelFilter);
  if (!rows.length) {
    return [{ key: item.id || "", item, label: summarySalesChannelLabel(item, lang, salesChannelFilter), amount: summaryEntryDisplayAmount(item, salesChannelFilter), isSale: true }];
  }
  return rows.map((row, index) => {
    const label = resolveSalesChannelRowLabel(row, channels as PrototypeChannel[], lang, channelName);
    return { key: `${item.id}-${row.channelId}-${index}`, item, label, amount: Number(row.amount), isSale: true };
  });
}
const signedEntryAmount = (entry: OperationalEntry) => entry.type === "summary" ? Number(entry.amount || 0) : -Number(entry.amount || 0);
const entryWasRestored = (entry: OperationalEntry) => Boolean(entry.restoredAt);

export const entryHasAttachment = (entry: OperationalEntry) => Boolean(entry.attachment);
export const entryIsVoided = (entry: OperationalEntry) => entry.status === "voided";
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
  entryIsActive,
  entryIsOutflow,
};
