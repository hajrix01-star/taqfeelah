"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveReportDateRange } from "@/features/reports/client/report-period-range";
import { fetchStoreEntriesPageViaApi } from "./store-entries-api-client";
import { mergeRegisterEntryPages } from "./merge-register-entry-pages";

const DEFAULT_PAGE_SIZE = 50;

export function useRegisterEntriesFromApi({
  enabled = false,
  organizationId = "",
  actorUserId = "",
  actorRole = "owner",
  storeIds = [],
  period = "day",
  selectedDate = "",
  selectedMonth = "",
  selectedYear = "",
  customFrom = "",
  customTo = "",
  refreshKey = 0,
  pageSize = DEFAULT_PAGE_SIZE,
}) {
  const storeIdsKey = useMemo(
    () => (Array.isArray(storeIds) ? storeIds.filter(Boolean).join("|") : ""),
    [storeIds],
  );

  const scopeKey = useMemo(() => {
    const range = resolveReportDateRange({
      period,
      selectedDate,
      selectedMonth,
      selectedYear,
      customFrom,
      customTo,
    });
    return [
      storeIdsKey,
      period,
      range.from,
      range.to,
      refreshKey,
      pageSize,
    ].join("|");
  }, [
    customFrom,
    customTo,
    pageSize,
    period,
    refreshKey,
    selectedDate,
    selectedMonth,
    selectedYear,
    storeIdsKey,
  ]);

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [error, setError] = useState("");
  const cursorsRef = useRef(new Map());
  const [hasMore, setHasMore] = useState(false);
  const requestIdRef = useRef(0);

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

  const fetchStorePages = useCallback(async (storeIdListToFetch, { cursors, requestId }) => {
    const responses = await Promise.all(
      storeIdListToFetch.map(async (storeId) => {
        const cursor = cursors.get(storeId) || "";
        const page = await fetchStoreEntriesPageViaApi({
          organizationId,
          actorUserId,
          actorRole,
          storeId,
          dateFrom: dateRange.from,
          dateTo: dateRange.to,
          status: "all",
          limit: pageSize,
          cursor,
        });
        if (requestId !== requestIdRef.current) return null;
        return { storeId, page };
      }),
    );

    return responses.filter(Boolean);
  }, [
    actorRole,
    actorUserId,
    dateRange.from,
    dateRange.to,
    organizationId,
    pageSize,
  ]);

  const applyPageResponses = useCallback((responses, { replace = false } = {}) => {
    const nextCursors = new Map(cursorsRef.current);
    let nextHasMore = false;

    setEntries((current) => {
      let nextEntries = replace ? [] : current;
      responses.forEach(({ storeId, page }) => {
        if (!storeId || !page) return;
        nextEntries = mergeRegisterEntryPages(nextEntries, page.items || []);
        if (page.nextCursor) {
          nextCursors.set(storeId, page.nextCursor);
          nextHasMore = true;
        } else {
          nextCursors.delete(storeId);
        }
      });
      return nextEntries;
    });

    cursorsRef.current = nextCursors;
    setHasMore(nextHasMore);
    return nextHasMore;
  }, []);

  const resetAndLoadFirstPage = useCallback(async () => {
    if (!enabled || !organizationId || !actorUserId || !storeIdList.length) {
      setEntries([]);
      setLoading(false);
      setLoadingMore(false);
      setLoadingAll(false);
      setError("");
      cursorsRef.current = new Map();
      setHasMore(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    cursorsRef.current = new Map();
    setHasMore(false);
    setEntries([]);
    setLoading(true);
    setError("");

    try {
      const responses = await fetchStorePages(storeIdList, {
        cursors: new Map(),
        requestId,
      });
      if (requestId !== requestIdRef.current) return;
      applyPageResponses(responses, { replace: true });
    } catch (loadError) {
      if (requestId !== requestIdRef.current) return;
      console.warn("register entries API load failed", loadError);
      setEntries([]);
      setError("failed");
      cursorsRef.current = new Map();
      setHasMore(false);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [
    actorUserId,
    applyPageResponses,
    enabled,
    fetchStorePages,
    organizationId,
    storeIdList,
  ]);

  useEffect(() => {
    if (!enabled) {
      setEntries([]);
      setLoading(false);
      setLoadingMore(false);
      setLoadingAll(false);
      setError("");
      cursorsRef.current = new Map();
      setHasMore(false);
      return undefined;
    }

    resetAndLoadFirstPage();
    return () => {
      requestIdRef.current += 1;
    };
  }, [enabled, resetAndLoadFirstPage, scopeKey]);

  const loadMore = useCallback(async () => {
    if (!enabled || loading || loadingMore || loadingAll || !hasMore) return false;

    const pendingStoreIds = storeIdList.filter((storeId) => cursorsRef.current.has(storeId));
    if (!pendingStoreIds.length) {
      setHasMore(false);
      return false;
    }

    const requestId = requestIdRef.current;
    setLoadingMore(true);
    try {
      const responses = await fetchStorePages(pendingStoreIds, {
        cursors: cursorsRef.current,
        requestId,
      });
      if (requestId !== requestIdRef.current) return false;
      return applyPageResponses(responses);
    } catch (loadError) {
      if (requestId !== requestIdRef.current) return false;
      console.warn("register entries API page load failed", loadError);
      setError("failed");
      return false;
    } finally {
      if (requestId === requestIdRef.current) setLoadingMore(false);
    }
  }, [
    applyPageResponses,
    enabled,
    fetchStorePages,
    hasMore,
    loading,
    loadingAll,
    loadingMore,
    storeIdList,
  ]);

  const loadAllRemaining = useCallback(async () => {
    if (!enabled || loading || loadingAll || !hasMore) return;

    const requestId = requestIdRef.current;
    setLoadingAll(true);
    try {
      let keepLoading = hasMore;
      while (keepLoading && requestId === requestIdRef.current) {
        const pendingStoreIds = storeIdList.filter((storeId) => cursorsRef.current.has(storeId));
        if (!pendingStoreIds.length) break;
        const responses = await fetchStorePages(pendingStoreIds, {
          cursors: cursorsRef.current,
          requestId,
        });
        if (requestId !== requestIdRef.current) return;
        keepLoading = applyPageResponses(responses);
      }
    } catch (loadError) {
      if (requestId !== requestIdRef.current) return;
      console.warn("register entries API full load failed", loadError);
      setError("failed");
    } finally {
      if (requestId === requestIdRef.current) setLoadingAll(false);
    }
  }, [
    applyPageResponses,
    enabled,
    fetchStorePages,
    hasMore,
    loading,
    loadingAll,
    storeIdList,
  ]);

  return {
    entries,
    loading,
    loadingMore,
    loadingAll,
    hasMore,
    error,
    loadMore,
    loadAllRemaining,
    enabled,
  };
}
