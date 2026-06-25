"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { operationalQueryKeys } from "@/core/client/operational-query-keys";
import { resolveReportDateRange } from "@/features/reports/client/report-period-range";
import {
  cursorsMapFromRecord,
  fetchRegisterEntriesPageBundle,
} from "./fetch-register-entries-page-bundle";
import type { RegisterEntriesPageState } from "./entries-client-types";

const DEFAULT_PAGE_SIZE = 50;
const emptyRegisterEntriesState: RegisterEntriesPageState = { entries: [], cursors: {}, hasMore: false };

export function useRegisterEntriesFromApi({
  enabled = false,
  organizationId = "",
  actorUserId = "",
  actorRole = "owner",
  storeIds = [] as string[],
  period = "day",
  selectedDate = "",
  selectedMonth = "",
  selectedYear = "",
  customFrom = "",
  customTo = "",
  pageSize = DEFAULT_PAGE_SIZE,
}: {
  enabled?: boolean;
  organizationId?: string;
  actorUserId?: string;
  actorRole?: string;
  storeIds?: string[];
  period?: string;
  selectedDate?: string;
  selectedMonth?: string;
  selectedYear?: string;
  customFrom?: string;
  customTo?: string;
  pageSize?: number;
} = {}) {
  const queryClient = useQueryClient();
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const storeIdsKey = useMemo(
    () => (Array.isArray(storeIds) ? storeIds.filter(Boolean).join("|") : ""),
    [storeIds],
  );

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

  const storeIdList = useMemo(
    () => (storeIdsKey ? storeIdsKey.split("|").filter(Boolean) : []),
    [storeIdsKey],
  );

  const queryKey = operationalQueryKeys.registerEntries({
    organizationId,
    actorUserId,
    actorRole,
    storeIdsKey,
    period,
    from: dateRange.from,
    to: dateRange.to,
    pageSize,
  });

  const queryEnabled = enabled
    && Boolean(organizationId)
    && Boolean(actorUserId)
    && storeIdList.length > 0;

  const query = useQuery({
    queryKey,
    queryFn: async () => fetchRegisterEntriesPageBundle({
      organizationId,
      actorUserId,
      actorRole,
      storeIdList,
      dateFrom: dateRange.from,
      dateTo: dateRange.to,
      pageSize,
      replace: true,
      currentEntries: [],
    }),
    enabled: queryEnabled,
  });

  const entries = query.data?.entries ?? emptyRegisterEntriesState.entries;
  const hasMore = query.data?.hasMore ?? false;
  const loading = queryEnabled && query.isPending;
  const loaded = queryEnabled && (query.isSuccess || query.isError);
  const error = query.isError ? "failed" : "";

  const loadMore = useCallback(async (): Promise<boolean> => {
    if (!queryEnabled || loading || loadingMore || !hasMore) return false;

    const current = queryClient.getQueryData<RegisterEntriesPageState>(queryKey) || emptyRegisterEntriesState;
    const pendingStoreIds = storeIdList.filter((storeId) => current.cursors?.[storeId]);
    if (!pendingStoreIds.length) {
      queryClient.setQueryData(queryKey, { ...current, hasMore: false });
      return false;
    }

    setLoadingMore(true);
    try {
      const next = await fetchRegisterEntriesPageBundle({
        organizationId,
        actorUserId,
        actorRole,
        storeIdList: pendingStoreIds,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        pageSize,
        cursors: cursorsMapFromRecord(current.cursors),
        replace: false,
        currentEntries: current.entries,
      });
      queryClient.setQueryData(queryKey, next);
      return next.hasMore;
    } catch (loadError) {
      console.warn("register entries API page load failed", loadError);
      return false;
    } finally {
      setLoadingMore(false);
    }
  }, [
    actorRole,
    actorUserId,
    dateRange.from,
    dateRange.to,
    hasMore,
    loading,
    loadingMore,
    organizationId,
    pageSize,
    queryClient,
    queryEnabled,
    queryKey,
    storeIdList,
  ]);

  const loadAllRemaining = useCallback(async (): Promise<void> => {
    if (!queryEnabled || loading || loadingAll || !hasMore) return;

    setLoadingAll(true);
    try {
      let keepLoading: boolean = hasMore;
      while (keepLoading) {
        keepLoading = await loadMore();
      }
    } finally {
      setLoadingAll(false);
    }
  }, [hasMore, loadingAll, loadMore, loading, queryEnabled]);

  return {
    entries,
    loading,
    loaded,
    loadingMore,
    loadingAll,
    hasMore,
    error,
    loadMore,
    loadAllRemaining,
    refetch: query.refetch,
    enabled,
  };
}
