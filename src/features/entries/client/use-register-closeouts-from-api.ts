"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { operationalQueryKeys } from "@/core/client/operational-query-keys";
import { resolveReportDateRange } from "@/features/reports/client/report-period-range";
import { fetchStoreCloseoutsViaApi } from "@/features/closeouts/client/closeouts-api-client";
import { withCloseoutTotals } from "@/features/daily-closeouts/daily-closeouts-demo-store";
import type { DailyCloseoutRecord } from "@/features/daily-closeouts/daily-closeouts-types";

export function useRegisterCloseoutsFromApi({
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
} = {}) {
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

  const queryEnabled = enabled
    && Boolean(organizationId)
    && Boolean(actorUserId)
    && storeIdList.length > 0;

  const query = useQuery({
    queryKey: operationalQueryKeys.closeouts({
      organizationId,
      actorUserId,
      actorRole,
      storeIdsKey,
      period,
      from: dateRange.from,
      to: dateRange.to,
      scope: "register",
    }),
    queryFn: async () => {
      const results = await Promise.all(
        storeIdList.map((storeId) => fetchStoreCloseoutsViaApi({
          organizationId,
          actorUserId,
          actorRole,
          storeId,
          dateFrom: dateRange.from,
          dateTo: dateRange.to,
        })),
      );
      return results
        .flat()
        .map((item) => withCloseoutTotals(item as DailyCloseoutRecord));
    },
    enabled: queryEnabled,
  });

  return {
    closeouts: query.data ?? [],
    loading: queryEnabled && query.isPending,
    loaded: queryEnabled && (query.isSuccess || query.isError),
    error: query.isError ? "failed" : "",
    refetch: query.refetch,
  };
}
