"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { operationalQueryKeys } from "@/core/client/operational-query-keys";
import { resolveReportDateRange } from "./report-period-range";
import { combineUiTotalsList } from "./map-reports-to-ui";
import { fetchStoreReportsBundle } from "./fetch-store-reports-bundle";

const emptyTotals = { sales: 0, expense: 0, ratio: "0.0%", net: 0, proofs: 0 };
const emptyReportsBundle = {
  totalsByStoreId: {},
  daysRows: [],
  channelRows: [],
  outflowCategories: [],
  outflowTransactions: [],
  outflowTransactionCount: 0,
  outflowTotal: 0,
  attachmentProofs: { proofs: 0, items: [] },
};

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

  const storeIds = useMemo(
    () => (storeIdsKey ? storeIdsKey.split("|").filter(Boolean) : []),
    [storeIdsKey],
  );

  const queryEnabled = enabled
    && Boolean(organizationId)
    && Boolean(actorUserId)
    && storeIds.length > 0;

  const query = useQuery({
    queryKey: operationalQueryKeys.reports({
      organizationId,
      actorUserId,
      actorRole,
      storeIdsKey,
      period,
      from: dateRange.from,
      to: dateRange.to,
      outflowCategory,
      includeOutflowTransactions,
    }),
    queryFn: async () => fetchStoreReportsBundle({
      organizationId,
      actorUserId,
      actorRole,
      storeIds,
      dateRange,
      period,
      configuredChannels,
      outflowCategory,
      includeOutflowTransactions,
    }),
    enabled: queryEnabled,
    placeholderData: keepPreviousData,
  });

  const bundle = query.data ?? emptyReportsBundle;
  const totalsByStoreId = bundle.totalsByStoreId;
  const loading = queryEnabled && query.isPending && !query.isPlaceholderData;
  const loaded = queryEnabled && (query.isSuccess || query.isError);
  const error = query.isError ? "failed" : "";

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
    loaded,
    hasData,
    dateRange,
    combinedTotals,
    singleStoreTotals,
    businessesWithSummaries,
    daysRows: bundle.daysRows,
    channelRows: bundle.channelRows,
    outflowCategories: bundle.outflowCategories,
    outflowTransactions: bundle.outflowTransactions,
    outflowTransactionCount: bundle.outflowTransactionCount,
    outflowTotal: bundle.outflowTotal,
    attachmentProofs: bundle.attachmentProofs,
  };
}
