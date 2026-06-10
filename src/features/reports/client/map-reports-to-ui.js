import { formatOutflowRatio } from "@/core/money/halalas";
import { mapDaySummaryToUiTotals } from "./map-day-summary-to-ui";

export function mapPeriodSummaryToTotals(apiSummary) {
  return mapDaySummaryToUiTotals(apiSummary);
}

export function mapDaysReportToUiRows(days = []) {
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

export function mapChannelsReportToUiRows(channels = [], configuredChannels = [], salesChannelIdMap = {}) {
  const reverseChannelMap = Object.fromEntries(
    Object.entries(salesChannelIdMap || {}).map(([key, value]) => [value, key]),
  );
  const configuredById = new Map((configuredChannels || []).map((channel) => [channel.id, channel]));
  const merged = new Map();

  (configuredChannels || []).forEach((channel) => {
    merged.set(channel.id, { ...channel, amount: 0 });
  });

  (Array.isArray(channels) ? channels : []).forEach((row) => {
    const mappedId = reverseChannelMap[row?.salesChannelId] || row?.salesChannelId;
    const configured = configuredById.get(mappedId);
    const current = merged.get(mappedId) || configured || {
      id: mappedId,
      custom: !configured,
      nameAr: row?.channelName || mappedId,
      nameEn: row?.channelName || mappedId,
      amount: 0,
    };
    merged.set(mappedId, {
      ...current,
      amount: Number(row?.amount?.amountHalalas || 0) / 100,
    });
  });

  return [...merged.values()]
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

export function mapOutflowCategoriesToUi(categories = []) {
  return (Array.isArray(categories) ? categories : [])
    .map((row) => ({
      id: row.categoryKey,
      amount: Number(row.amountHalalas || 0) / 100,
    }))
    .filter((row) => row.amount > 0);
}

export function mapOutflowTransactionsToUi(transactions = [], storeId = "") {
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

export function mapAttachmentsReportToProofs(report) {
  return {
    proofs: Number(report?.attachmentCount || report?.entriesWithAttachments || 0),
    items: Array.isArray(report?.items) ? report.items : [],
  };
}

export { combineUiTotals as combineUiTotalsList } from "./map-day-summary-to-ui";
