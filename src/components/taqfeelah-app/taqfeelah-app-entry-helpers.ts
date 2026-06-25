import {
  filterSummaryChannelRows,
  summarySalesChannelLabel as buildSummarySalesChannelLabel,
} from "@/features/entries/client/register-operation-display";
import { signedOperationalEntryAmount } from "@/features/entries/client/resolve-operational-entry-amount";
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
} from "./taqfeelah-app-demo-data";
import type { OperationalEntry, PrototypeChannel, PrototypeLang } from "./taqfeelah-app-types";

const noteLabel = (entry: OperationalEntry, lang: PrototypeLang) => {
  if (entry.type === "summary") return summarySalesChannelLabel(entry, lang);
  if (entry.noteKey) return text(lang, entry.noteKey);
  return entry.note || text(lang, entry.type || "");
};
const entryCategory = (entry: OperationalEntry) => entry.type === "purchases" ? "purchases" : entry.type === "withdrawal" ? "withdrawal" : (entry.categoryId || "other");
function resolveConfiguredChannels(configuredChannels?: PrototypeChannel[]): PrototypeChannel[] {
  return configuredChannels?.length ? configuredChannels : (channels as PrototypeChannel[]);
}

function resolveSummaryChannelName(
  row: Record<string, unknown>,
  lang: PrototypeLang,
  configuredChannels?: PrototypeChannel[],
) {
  return resolveSalesChannelRowLabel(row, resolveConfiguredChannels(configuredChannels), lang, channelName);
}
function summarySalesChannelLabel(
  entry: OperationalEntry,
  lang: PrototypeLang,
  salesChannelFilter = "all",
  configuredChannels?: PrototypeChannel[],
) {
  return buildSummarySalesChannelLabel(
    entry,
    (row) => resolveSummaryChannelName(row, lang, configuredChannels),
    salesChannelFilter,
    text(lang, "summary"),
  );
}
const operationDisplayLabel = (
  entry: OperationalEntry,
  lang: PrototypeLang,
  salesChannelFilter = "all",
  configuredChannels?: PrototypeChannel[],
) => {
  if (entry.type === "expense") return text(lang, expenseCategories.find((item) => item.id === entryCategory(entry))?.label || "other");
  if (entry.type === "summary") return summarySalesChannelLabel(entry, lang, salesChannelFilter, configuredChannels);
  return text(lang, entry.type || "");
};
function expandRegisterCloseoutOperationRows(
  item: OperationalEntry,
  lang: PrototypeLang,
  salesChannelFilter = "all",
  configuredChannels?: PrototypeChannel[],
) {
  const channelCatalog = resolveConfiguredChannels(configuredChannels);
  if (item.type !== "summary") {
    return [{ key: item.id || "", item, label: operationDisplayLabel(item, lang, salesChannelFilter, channelCatalog), amount: signedEntryAmount(item), isSale: false }];
  }
  const rows = filterSummaryChannelRows(item, salesChannelFilter);
  if (!rows.length) {
    return [{ key: item.id || "", item, label: summarySalesChannelLabel(item, lang, salesChannelFilter, channelCatalog), amount: signedOperationalEntryAmount(item, salesChannelFilter), isSale: true }];
  }
  return rows.map((row, index) => {
    const label = resolveSalesChannelRowLabel(row, channelCatalog, lang, channelName);
    const resolvedLabel = label || text(lang, "summary");
    return { key: `${item.id}-${row.channelId}-${index}`, item, label: resolvedLabel, amount: Number(row.amount), isSale: true };
  });
}
const signedEntryAmount = (entry: OperationalEntry, salesChannelFilter = "all") => (
  signedOperationalEntryAmount(entry, salesChannelFilter)
);
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
