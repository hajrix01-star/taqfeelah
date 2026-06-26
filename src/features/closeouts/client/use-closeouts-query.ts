"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { operationalQueryKeys } from "@/core/client/operational-query-keys";
import { withCloseoutTotals } from "@/features/daily-closeouts/daily-closeouts-local-store";
import type { DailyCloseoutRecord } from "@/features/daily-closeouts/daily-closeouts-types";

export function normalizeCloseoutsQueryResult(raw: unknown[]): DailyCloseoutRecord[] {
  return raw.map((item) => withCloseoutTotals(item as DailyCloseoutRecord));
}

export function buildCloseoutsQueryKey(autoLoadQueryKey: string) {
  return operationalQueryKeys.closeouts({ autoLoadKey: autoLoadQueryKey });
}

type UseCloseoutsQueryOptions = {
  enabled?: boolean;
  autoLoadQueryKey?: string;
  loadCloseoutsFromApi?: (() => Promise<unknown[]>) | null;
};

/**
 * React Query layer for closeouts — shared by DailyCloseoutsProvider and register resolution.
 */
export function useCloseoutsQuery({
  enabled = false,
  autoLoadQueryKey = "",
  loadCloseoutsFromApi = null,
}: UseCloseoutsQueryOptions) {
  const queryClient = useQueryClient();
  const queryKey = buildCloseoutsQueryKey(autoLoadQueryKey || "disabled");
  const queryEnabled = enabled
    && Boolean(autoLoadQueryKey)
    && typeof loadCloseoutsFromApi === "function";

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const remote = await loadCloseoutsFromApi!();
      return normalizeCloseoutsQueryResult(Array.isArray(remote) ? remote : []);
    },
    enabled: queryEnabled,
  });

  const reloadCloseoutsFromApi = useCallback(async (): Promise<DailyCloseoutRecord[]> => {
    if (!queryEnabled) return [];
    const result = await query.refetch();
    return result.data ?? [];
  }, [query, queryEnabled]);

  const upsertCloseoutInCache = useCallback((nextCloseout: DailyCloseoutRecord) => {
    if (!queryEnabled) return;
    const normalized = withCloseoutTotals(nextCloseout);
    queryClient.setQueryData<DailyCloseoutRecord[]>(queryKey, (current) => {
      const list = Array.isArray(current) ? current : [];
      const index = list.findIndex((item) => item.id === normalized.id);
      if (index === -1) return [normalized, ...list];
      const copy = [...list];
      copy[index] = normalized;
      return copy;
    });
    return normalized;
  }, [queryClient, queryEnabled, queryKey]);

  const removeCloseoutFromCache = useCallback((closeoutId: string) => {
    if (!queryEnabled) return;
    queryClient.setQueryData<DailyCloseoutRecord[]>(queryKey, (current) => (
      Array.isArray(current) ? current.filter((item) => item.id !== closeoutId) : []
    ));
  }, [queryClient, queryEnabled, queryKey]);

  return {
    queryKey,
    closeouts: query.data ?? [],
    closeoutsLoading: query.isPending,
    closeoutsLoaded: query.isFetched,
    closeoutsError: query.error,
    reloadCloseoutsFromApi,
    upsertCloseoutInCache,
    removeCloseoutFromCache,
  };
}
