import { formatOutflowRatio } from "@/core/money/halalas";
import { resolveAggregatedChannelShape } from "@/features/org-config/client/sales-channel-display";
import type { JsonStringMap } from "@/core/client/client-types";
import type {
  ApiAttachmentsReport,
  ApiChannelReportRow,
  ApiDayReportRow,
  ApiOutflowCategoryRow,
  ApiOutflowTransactionRow,
  ApiPeriodSummary,
  UiChannelReportRow,
  UiDayReportRow,
  UiOutflowCategoryRow,
  UiTotalsRecord,
} from "@/features/reports/client/reports-client-types";
import type { OperationalEntry } from "@/features/entries/client/entries-client-types";
import { mapDaySummaryToUiTotals } from "./map-day-summary-to-ui";

export function mapPeriodSummaryToTotals(apiSummary: ApiPeriodSummary | null | undefined): UiTotalsRecord {
  return mapDaySummaryToUiTotals(apiSummary);
}

export function mapDaysReportToUiRows(days: ApiDayReportRow[] = []): UiDayReportRow[] {
  return (Array.isArray(days) ? days : []).map((row) => {
    const salesHalalas = Number(row?.totalSales?.amountHalalas || 0);
    const outflowHalalas = Number(row?.totalOutflow?.amountHalalas || 0);
    const ratio = row?.outflowRatioStatus === "notCalculable"
      ? "—"
      : (typeof row?.outflowRatio === "string"
        ? row.outflowRatio
        : formatOutflowRatio(salesHalalas, outflowHalalas).ratio);

    return {
      id: row.date,
      dayAr: row.date,
      dayEn: row.date,
      sales: salesHalalas / 100,
      expense: outflowHalalas / 100,
      net: Number(row?.netMovement?.amountHalalas || 0) / 100,
      ratio,
      proofs: 0,
    };
  });
}

export function mapChannelsReportToUiRows(
  channels: ApiChannelReportRow[] = [],
  configuredChannels: Array<Record<string, unknown> & { id?: string; amount?: number }> = [],
  salesChannelIdMap: JsonStringMap = {},
): UiChannelReportRow[] {
  const reverseChannelMap = Object.fromEntries(
    Object.entries(salesChannelIdMap || {}).map(([key, value]) => [value, key]),
  );
  const configuredById = new Map((configuredChannels || []).map((channel) => [channel.id, channel]));
  const merged = new Map<string, UiChannelReportRow>();

  (configuredChannels || []).forEach((channel) => {
    if (channel.id) merged.set(channel.id, { ...channel, amount: 0 });
  });

  (Array.isArray(channels) ? channels : []).forEach((row) => {
    const mappedId = reverseChannelMap[row?.salesChannelId || ""] || row?.salesChannelId;
    const configured = configuredById.get(mappedId);
    const current = merged.get(String(mappedId)) || configured || resolveAggregatedChannelShape({
      channelId: mappedId,
      name: row?.channelName || mappedId,
    }, configuredChannels);
    merged.set(String(mappedId), {
      ...current,
      amount: Number(row?.amount?.amountHalalas || 0) / 100,
    });
  });

  return [...merged.values()]
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

export function mapOutflowCategoriesToUi(categories: ApiOutflowCategoryRow[] = []): UiOutflowCategoryRow[] {
  return (Array.isArray(categories) ? categories : [])
    .map((row) => ({
      id: row.categoryKey,
      amount: Number(row.amountHalalas || 0) / 100,
    }))
    .filter((row) => row.amount > 0);
}

export function mapOutflowTransactionsToUi(
  transactions: ApiOutflowTransactionRow[] = [],
  storeId = "",
): OperationalEntry[] {
  return (Array.isArray(transactions) ? transactions : []).map((row) => ({
    id: row.id,
    businessId: storeId,
    date: row.date,
    type: row.type,
    categoryId: row.categoryKey,
    amount: Number(row.amountHalalas || 0) / 100,
    attachment: row.hasAttachment ? { id: `${row.id}-att` } : null,
    status: "active",
    reviewed: false,
  }));
}

export function mapAttachmentsReportToProofs(report: ApiAttachmentsReport | null | undefined): {
  proofs: number;
  items: unknown[];
} {
  return {
    proofs: Number(report?.attachmentCount || report?.entriesWithAttachments || 0),
    items: Array.isArray(report?.items) ? report.items : [],
  };
}

export { combineUiTotals as combineUiTotalsList } from "./map-day-summary-to-ui";
