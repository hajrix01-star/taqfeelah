import {
  mapAttachmentsReportToProofs,
  mapChannelsReportToUiRows,
  mapDaysReportToUiRows,
  mapOutflowCategoriesToUi,
  mapOutflowTransactionsToUi,
  mapPeriodSummaryToTotals,
} from "./map-reports-to-ui";
import {
  fetchStoreAttachmentsReportViaApi,
  fetchStoreChannelsReportViaApi,
  fetchStoreDaysReportViaApi,
  fetchStoreOutflowReportViaApi,
  fetchStorePeriodSummaryViaApi,
  getReportsApiMaps,
} from "./store-reports-api-client";
import type {
  FetchStoreReportsBundleInput,
  StoreReportsBundle,
  UiDayReportRow,
} from "@/features/reports/client/reports-client-types";

function combineDayRows(rows: UiDayReportRow[]): UiDayReportRow[] {
  const byDate = new Map<string, UiDayReportRow>();
  rows.forEach((row) => {
    const date = String(row.id || row.dayEn || row.dayAr || "");
    if (!date) return;
    const current = byDate.get(date) || {
      id: date,
      dayAr: date,
      dayEn: date,
      sales: 0,
      expense: 0,
      net: 0,
      ratio: "0.0%",
      proofs: 0,
    };
    byDate.set(date, {
      ...current,
      sales: current.sales + Number(row.sales || 0),
      expense: current.expense + Number(row.expense || 0),
      net: current.net + Number(row.net || 0),
      proofs: current.proofs + Number(row.proofs || 0),
    });
  });
  return [...byDate.values()].sort((left, right) => right.id.localeCompare(left.id));
}

export async function fetchStoreReportsBundle({
  organizationId,
  actorUserId,
  actorRole,
  storeIds,
  dateRange,
  period,
  configuredChannels,
  outflowCategory,
  includeOutflowTransactions,
  includeDetails = true,
}: FetchStoreReportsBundleInput): Promise<StoreReportsBundle> {
  const summaryResults = await Promise.all(
    storeIds.map((storeId) => fetchStorePeriodSummaryViaApi({
      organizationId,
      actorUserId,
      actorRole,
      storeId,
      from: dateRange.from,
      to: dateRange.to,
      period,
    })),
  );

  const totalsByStoreId: Record<string, ReturnType<typeof mapPeriodSummaryToTotals>> = {};
  summaryResults.forEach((summary, index) => {
    const storeId = storeIds[index];
    if (!storeId || !summary) return;
    totalsByStoreId[storeId] = mapPeriodSummaryToTotals(summary);
  });

  const isSingleStore = storeIds.length === 1;
  if (!includeDetails) {
    return {
      totalsByStoreId,
      daysRows: [],
      channelRows: [],
      outflowCategories: [],
      outflowTransactions: [],
      outflowTransactionCount: 0,
      outflowTotal: 0,
      attachmentProofs: { proofs: 0, items: [] },
    };
  }

  if (!isSingleStore) {
    const daysReports = await Promise.all(
      storeIds.map((storeId) => fetchStoreDaysReportViaApi({
        organizationId,
        actorUserId,
        actorRole,
        storeId,
        from: dateRange.from,
        to: dateRange.to,
      })),
    );
    return {
      totalsByStoreId,
      daysRows: combineDayRows(daysReports.flatMap((report) => mapDaysReportToUiRows(report?.days))),
      channelRows: [],
      outflowCategories: [],
      outflowTransactions: [],
      outflowTransactionCount: 0,
      outflowTotal: 0,
      attachmentProofs: { proofs: 0, items: [] },
    };
  }

  const primaryStoreId = storeIds[0];
  const [daysReport, channelsReport, outflowReport, attachmentsReport] = await Promise.all([
    fetchStoreDaysReportViaApi({
      organizationId,
      actorUserId,
      actorRole,
      storeId: primaryStoreId,
      from: dateRange.from,
      to: dateRange.to,
    }),
    fetchStoreChannelsReportViaApi({
      organizationId,
      actorUserId,
      actorRole,
      storeId: primaryStoreId,
      from: dateRange.from,
      to: dateRange.to,
    }),
    fetchStoreOutflowReportViaApi({
      organizationId,
      actorUserId,
      actorRole,
      storeId: primaryStoreId,
      from: dateRange.from,
      to: dateRange.to,
      categoryKey: outflowCategory,
      includeTransactions: includeOutflowTransactions,
    }),
    fetchStoreAttachmentsReportViaApi({
      organizationId,
      actorUserId,
      actorRole,
      storeId: primaryStoreId,
      from: dateRange.from,
      to: dateRange.to,
    }),
  ]);

  const { salesChannelIdMap } = getReportsApiMaps();

  return {
    totalsByStoreId,
    daysRows: mapDaysReportToUiRows(daysReport?.days),
    channelRows: mapChannelsReportToUiRows(
      channelsReport?.channels,
      configuredChannels,
      salesChannelIdMap,
    ),
    outflowCategories: mapOutflowCategoriesToUi(outflowReport?.categories),
    outflowTransactions: mapOutflowTransactionsToUi(
      outflowReport?.transactions,
      primaryStoreId,
    ),
    outflowTransactionCount: Number(outflowReport?.transactionCount || 0),
    outflowTotal: Number(outflowReport?.totalOutflow?.amountHalalas || 0) / 100,
    attachmentProofs: mapAttachmentsReportToProofs(attachmentsReport),
  };
}
