"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const loadedContextRef = useRef("");
  const refreshKeyRef = useRef(refreshKey);
  const loadContextKey = `${period}|${periodKey}|${storeIdsKey}`;

  useEffect(() => {
    if (!enabled || !periodKey || !organizationId || !actorUserId || !storeIdsKey) {
      setSummariesByStoreId({});
      setLoading(false);
      setError("");
      setLoaded(false);
      loadedContextRef.current = "";
      return undefined;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      const contextChanged = loadedContextRef.current !== loadContextKey;
      const refreshKeyChanged = refreshKeyRef.current !== refreshKey;
      if (contextChanged || refreshKeyChanged) {
        setSummariesByStoreId({});
        setLoaded(false);
      }
      refreshKeyRef.current = refreshKey;
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
        loadedContextRef.current = loadContextKey;
      } catch (loadError) {
        if (cancelled) return;
        console.warn(`${period} summary API load failed`, loadError);
        setError("failed");
        if (loadedContextRef.current !== loadContextKey) {
          setSummariesByStoreId({});
          setLoaded(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [actorRole, actorUserId, date, enabled, loadContextKey, month, organizationId, period, periodKey, refreshKey, storeIdsKey]);

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
  const hasData = Object.keys(summariesByStoreId).length > 0;

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
