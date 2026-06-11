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
}) {
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

  const totalsByStoreId = {};
  summaryResults.forEach((summary, index) => {
    const storeId = storeIds[index];
    if (!storeId || !summary) return;
    totalsByStoreId[storeId] = mapPeriodSummaryToTotals(summary);
  });

  const isSingleStore = storeIds.length === 1;
  if (!isSingleStore) {
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
