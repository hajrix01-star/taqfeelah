"use client";

import { keepPreviousData, useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { operationalQueryKeys } from "@/core/client/operational-query-keys";
import { combineUiTotals, mapDaySummaryToUiTotals } from "./map-day-summary-to-ui";
import { fetchStoreDaySummaryViaApi, fetchStoreMonthSummaryViaApi } from "./store-summary-api-client";

const emptyStoreRecord = { sales: 0, expense: 0, ratio: "0.0%", net: 0, proofs: 0 };

async function fetchStoreSummaryForPeriod({
  period,
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  date,
  month,
}) {
  if (period === "month") {
    return fetchStoreMonthSummaryViaApi({
      organizationId,
      actorUserId,
      actorRole,
      storeId,
      month,
    });
  }
  return fetchStoreDaySummaryViaApi({
    organizationId,
    actorUserId,
    actorRole,
    storeId,
    date,
  });
}

export function useStoreDaySummaries({
  enabled = false,
  period = "day",
  organizationId = "",
  actorUserId = "",
  actorRole = "owner",
  businesses = [],
  date = "",
  month = "",
}) {
  const storeIds = useMemo(
    () => businesses.map((business) => business?.id).filter(Boolean),
    [businesses],
  );
  const periodKey = period === "month" ? month : date;
  const queryEnabled = enabled
    && Boolean(periodKey)
    && Boolean(organizationId)
    && Boolean(actorUserId)
    && storeIds.length > 0;

  const summaryQueries = useQueries({
    queries: storeIds.map((storeId) => ({
      queryKey: operationalQueryKeys.summaryPeriod({
        organizationId,
        actorUserId,
        actorRole,
        period,
        periodKey,
        storeId,
      }),
      queryFn: async () => {
        const summary = await fetchStoreSummaryForPeriod({
          period,
          organizationId,
          actorUserId,
          actorRole,
          storeId,
          date,
          month,
        });
        return summary ? mapDaySummaryToUiTotals(summary) : null;
      },
      enabled: queryEnabled,
      placeholderData: keepPreviousData,
    })),
  });

  const summariesByStoreId = useMemo(() => {
    const next = {};
    summaryQueries.forEach((result, index) => {
      const storeId = storeIds[index];
      if (!storeId || !result.data) return;
      next[storeId] = result.data;
    });
    return next;
  }, [storeIds, summaryQueries]);

  const loading = queryEnabled && summaryQueries.some((result) => result.isLoading);
  const loaded = queryEnabled && summaryQueries.length > 0 && summaryQueries.every((result) => result.isSuccess || result.isError);
  const error = summaryQueries.some((result) => result.isError) ? "failed" : "";
  const hasData = Object.keys(summariesByStoreId).length > 0;

  const businessesWithDaySummaries = useMemo(
    () => businesses.map((business) => ({
      ...business,
      day: period === "day"
        ? (summariesByStoreId[business.id] || business.day || { ...emptyStoreRecord })
        : business.day,
      month: period === "month"
        ? (summariesByStoreId[business.id] || business.month || { ...emptyStoreRecord })
        : business.month,
    })),
    [businesses, period, summariesByStoreId],
  );

  const combinedResult = useMemo(
    () => combineUiTotals(Object.values(summariesByStoreId)),
    [summariesByStoreId],
  );

  const getStoreResult = (storeId) => summariesByStoreId[storeId] || null;

  return {
    summariesByStoreId,
    businessesWithDaySummaries,
    combinedResult,
    getStoreResult,
    loading,
    error,
    loaded,
    hasData,
    enabled,
    period,
  };
}
