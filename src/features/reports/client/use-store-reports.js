"use client";

import { useEffect, useMemo, useState } from "react";
import { resolveReportDateRange } from "./report-period-range";
import {
  combineUiTotalsList,
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

const emptyTotals = { sales: 0, expense: 0, ratio: "0.0%", net: 0, proofs: 0, pending: 0 };

export function useStoreReports({
  enabled = false,
  organizationId = "",
  actorUserId = "",
  actorRole = "owner",
  businesses = [],
  selectedStoreId = "",
  period = "day",
  selectedDate = "",
  selectedMonth = "",
  selectedYear = "",
  customFrom = "",
  customTo = "",
  configuredChannels = [],
  outflowCategory = "all",
  includeOutflowTransactions = false,
  refreshKey = 0,
}) {
  const storeIdsKey = useMemo(() => {
    if (selectedStoreId && selectedStoreId !== "all") return selectedStoreId;
    return businesses.map((business) => business?.id).filter(Boolean).join("|");
  }, [businesses, selectedStoreId]);

  const dateRange = useMemo(
    () => resolveReportDateRange({
      period,
      selectedDate,
      selectedMonth,
      selectedYear,
      customFrom,
      customTo,
    }),
    [customFrom, customTo, period, selectedDate, selectedMonth, selectedYear],
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalsByStoreId, setTotalsByStoreId] = useState({});
  const [daysRows, setDaysRows] = useState([]);
  const [channelRows, setChannelRows] = useState([]);
  const [outflowCategories, setOutflowCategories] = useState([]);
  const [outflowTransactions, setOutflowTransactions] = useState([]);
  const [outflowTransactionCount, setOutflowTransactionCount] = useState(0);
  const [outflowTotal, setOutflowTotal] = useState(0);
  const [attachmentProofs, setAttachmentProofs] = useState({ proofs: 0, pending: 0, items: [] });

  useEffect(() => {
    if (!enabled || !organizationId || !actorUserId || !storeIdsKey) {
      setTotalsByStoreId({});
      setDaysRows([]);
      setChannelRows([]);
      setOutflowCategories([]);
      setOutflowTransactions([]);
      setOutflowTransactionCount(0);
      setOutflowTotal(0);
      setAttachmentProofs({ proofs: 0, pending: 0, items: [] });
      setLoading(false);
      setError("");
      return undefined;
    }

    let cancelled = false;
    const storeIds = storeIdsKey.split("|").filter(Boolean);
    const isSingleStore = storeIds.length === 1;
    const primaryStoreId = isSingleStore ? storeIds[0] : "";

    const load = async () => {
      setLoading(true);
      setError("");
      try {
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

        if (cancelled) return;

        const nextTotalsByStoreId = {};
        summaryResults.forEach((summary, index) => {
          const storeId = storeIds[index];
          if (!storeId || !summary) return;
          nextTotalsByStoreId[storeId] = mapPeriodSummaryToTotals(summary);
        });
        setTotalsByStoreId(nextTotalsByStoreId);

        if (!isSingleStore) {
          setDaysRows([]);
          setChannelRows([]);
          setOutflowCategories([]);
          setOutflowTransactions([]);
          setOutflowTransactionCount(0);
          setOutflowTotal(0);
          setAttachmentProofs({ proofs: 0, pending: 0, items: [] });
          return;
        }

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

        if (cancelled) return;

        const { salesChannelIdMap } = getReportsApiMaps();
        setDaysRows(mapDaysReportToUiRows(daysReport?.days));
        setChannelRows(mapChannelsReportToUiRows(
          channelsReport?.channels,
          configuredChannels,
          salesChannelIdMap,
        ));
        setOutflowCategories(mapOutflowCategoriesToUi(outflowReport?.categories));
        setOutflowTransactions(mapOutflowTransactionsToUi(
          outflowReport?.transactions,
          primaryStoreId,
        ));
        setOutflowTransactionCount(Number(outflowReport?.transactionCount || 0));
        setOutflowTotal(Number(outflowReport?.totalOutflow?.amountHalalas || 0) / 100);
        setAttachmentProofs(mapAttachmentsReportToProofs(attachmentsReport));
      } catch (loadError) {
        if (cancelled) return;
        console.warn("store reports API load failed", loadError);
        setTotalsByStoreId({});
        setDaysRows([]);
        setChannelRows([]);
        setOutflowCategories([]);
        setOutflowTransactions([]);
        setOutflowTransactionCount(0);
        setOutflowTotal(0);
        setAttachmentProofs({ proofs: 0, pending: 0, items: [] });
        setError("failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [
    actorRole,
    actorUserId,
    configuredChannels,
    customFrom,
    customTo,
    dateRange.from,
    dateRange.to,
    enabled,
    includeOutflowTransactions,
    organizationId,
    outflowCategory,
    period,
    refreshKey,
    selectedDate,
    selectedMonth,
    selectedYear,
    storeIdsKey,
  ]);

  const businessesWithSummaries = useMemo(
    () => businesses.map((business) => ({
      ...business,
      [period === "month" ? "month" : "day"]: totalsByStoreId[business.id] || business[period === "month" ? "month" : "day"] || { ...emptyTotals },
    })),
    [businesses, period, totalsByStoreId],
  );

  const combinedTotals = useMemo(
    () => combineUiTotalsList(Object.values(totalsByStoreId)),
    [totalsByStoreId],
  );

  const singleStoreTotals = selectedStoreId && selectedStoreId !== "all"
    ? totalsByStoreId[selectedStoreId] || null
    : null;

  const hasData = Object.keys(totalsByStoreId).length > 0;

  return {
    loading,
    error,
    hasData,
    dateRange,
    combinedTotals,
    singleStoreTotals,
    businessesWithSummaries,
    daysRows,
    channelRows,
    outflowCategories,
    outflowTransactions,
    outflowTransactionCount,
    outflowTotal,
    attachmentProofs,
  };
}
