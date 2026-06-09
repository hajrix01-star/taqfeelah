"use client";

import { useEffect, useMemo, useState } from "react";
import { combineUiTotals, mapDaySummaryToUiTotals } from "./map-day-summary-to-ui";
import { fetchStoreDaySummaryViaApi, fetchStoreMonthSummaryViaApi } from "./store-summary-api-client";

const emptyStoreRecord = { sales: 0, expense: 0, ratio: "0.0%", net: 0, proofs: 0, pending: 0 };

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
  refreshKey = 0,
}) {
  const storeIdsKey = useMemo(
    () => businesses.map((business) => business?.id).filter(Boolean).join("|"),
    [businesses],
  );
  const periodKey = period === "month" ? month : date;

  const [summariesByStoreId, setSummariesByStoreId] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled || !periodKey || !organizationId || !actorUserId || !storeIdsKey) {
      setSummariesByStoreId({});
      setLoading(false);
      setError("");
      setLoaded(false);
      return undefined;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      setLoaded(false);
      try {
        const storeIds = storeIdsKey.split("|").filter(Boolean);
        const fetched = await Promise.all(
          storeIds.map(async (storeId) => {
            const summary = await fetchStoreSummaryForPeriod({
              period,
              organizationId,
              actorUserId,
              actorRole,
              storeId,
              date,
              month,
            });
            return { storeId, summary };
          }),
        );

        if (cancelled) return;

        const next = {};
        fetched.forEach(({ storeId, summary }) => {
          if (!storeId || !summary) return;
          next[storeId] = mapDaySummaryToUiTotals(summary);
        });
        setSummariesByStoreId(next);
        setLoaded(true);
      } catch (loadError) {
        if (cancelled) return;
        console.warn(`${period} summary API load failed`, loadError);
        setSummariesByStoreId({});
        setError("failed");
        setLoaded(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [actorRole, actorUserId, date, enabled, month, organizationId, period, periodKey, refreshKey, storeIdsKey]);

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
    enabled,
    period,
  };
}
