"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { operationalQueryKeys } from "@/core/client/operational-query-keys";
import { resolveReportDateRange } from "@/features/reports/client/report-period-range";
import { mapPeriodSummaryToTotals, combineUiTotalsList } from "@/features/reports/client/map-reports-to-ui";
import { withCloseoutTotals } from "@/features/daily-closeouts/daily-closeouts-demo-store";
import { fetchRegisterOverviewViaApi } from "./register-overview-api-client";
import type { DailyCloseoutRecord } from "@/features/daily-closeouts/daily-closeouts-types";
import type { ApiPeriodSummary } from "@/features/reports/client/reports-client-types";
import type { UiTotalsRecord } from "@/features/reports/client/reports-client-types";

const emptyTotals: UiTotalsRecord = { sales: 0, expense: 0, net: 0, ratio: "0.0%", proofs: 0 };

export function useRegisterOverviewFromApi({
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
  const storeIdList = useMemo(
    () => (storeIdsKey ? storeIdsKey.split("|").filter(Boolean) : []),
    [storeIdsKey],
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
  const queryEnabled = enabled
    && Boolean(organizationId)
    && Boolean(actorUserId)
    && storeIdList.length > 0;

  const query = useQuery({
    queryKey: operationalQueryKeys.registerOverview({
      organizationId,
      actorUserId,
      actorRole,
      storeIdsKey,
      period,
      from: dateRange.from,
      to: dateRange.to,
    }),
    queryFn: () => fetchRegisterOverviewViaApi({
      organizationId,
      actorUserId,
      actorRole,
      storeIds: storeIdList,
      period,
      from: dateRange.from,
      to: dateRange.to,
    }),
    enabled: queryEnabled,
  });

  const totalsByStoreId = useMemo(() => {
    const raw = query.data?.totalsByStoreId && typeof query.data.totalsByStoreId === "object"
      ? query.data.totalsByStoreId as Record<string, unknown>
      : {};
    return Object.fromEntries(
      Object.entries(raw).map(([storeId, value]) => [storeId, mapPeriodSummaryToTotals(value as ApiPeriodSummary)]),
    ) as Record<string, UiTotalsRecord>;
  }, [query.data]);

  const combinedTotals = useMemo(
    () => combineUiTotalsList(Object.values(totalsByStoreId)),
    [totalsByStoreId],
  );

  return {
    closeouts: (Array.isArray(query.data?.closeouts) ? query.data.closeouts : [])
      .map((item) => withCloseoutTotals(item as DailyCloseoutRecord)),
    totalsByStoreId,
    combinedTotals: Object.keys(totalsByStoreId).length ? combinedTotals : emptyTotals,
    loading: queryEnabled && query.isPending,
    loaded: queryEnabled && (query.isSuccess || query.isError),
    error: query.isError ? "failed" : "",
    refetch: query.refetch,
  };
}
