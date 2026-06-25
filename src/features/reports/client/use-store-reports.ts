"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { operationalQueryKeys } from "@/core/client/operational-query-keys";
import { isEntriesApiDbSourceMode } from "@/core/config/entries-api-mode";
import { resolveReportDateRange } from "./report-period-range";
import { combineUiTotalsList } from "./map-reports-to-ui";
import { fetchStoreReportsBundle } from "./fetch-store-reports-bundle";
import type { StoreReportsBundle, UiTotalsRecord, UseStoreReportsProps } from "@/features/reports/client/reports-client-types";

const emptyTotals: UiTotalsRecord = { sales: 0, expense: 0, ratio: "0.0%", net: 0, proofs: 0 };
const emptyReportsBundle: StoreReportsBundle = {
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
  includeDetails = true,
}: UseStoreReportsProps) {
  const strictDbSource = isEntriesApiDbSourceMode();
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
      includeDetails,
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
      includeDetails,
    }),
    enabled: queryEnabled,
  });

  const bundle = query.data ?? emptyReportsBundle;
  const totalsByStoreId = bundle.totalsByStoreId;
  const loading = queryEnabled && query.isPending;
  const loaded = queryEnabled && (query.isSuccess || query.isError);
  const error = query.isError ? "failed" : "";

  const businessesWithSummaries = useMemo(
    () => businesses.map((business) => ({
      ...business,
      [period === "month" ? "month" : "day"]: totalsByStoreId[String(business.id)]
        || (strictDbSource ? { ...emptyTotals } : business[period === "month" ? "month" : "day"])
        || { ...emptyTotals },
    })),
    [businesses, period, strictDbSource, totalsByStoreId],
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
    getStoreResult: (storeId: string) => totalsByStoreId[storeId] || null,
  };
}
