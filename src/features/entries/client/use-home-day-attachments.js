"use client";

import { useEffect, useMemo, useState } from "react";
import { attachmentsFromEntries } from "@/components/prototype-runtime/prototype-runtime-demo-operational-entries";
import { fetchStoreEntriesViaApi } from "./store-entries-api-client";
import { resolveAttachmentGroupForDate } from "./attachments-from-entries";

export function shouldFetchHomeDayAttachments({
  enabled = false,
  localItemCount = 0,
  proofsCount = 0,
  entriesApiEnabled = false,
  organizationId = "",
  actorUserId = "",
  storeId = "",
  selectedDate = "",
} = {}) {
  return enabled
    && entriesApiEnabled
    && Boolean(storeId)
    && Boolean(selectedDate)
    && Boolean(organizationId)
    && Boolean(actorUserId)
    && localItemCount === 0
    && proofsCount > 0;
}

export function useHomeDayAttachments({
  enabled = false,
  localDayEntries = [],
  selectedDate = "",
  proofsCount = 0,
  entriesApiEnabled = false,
  organizationId = "",
  actorUserId = "",
  actorRole = "owner",
  storeId = "",
  refreshKey = 0,
}) {
  const localGroup = useMemo(
    () => resolveAttachmentGroupForDate(attachmentsFromEntries(localDayEntries), selectedDate),
    [localDayEntries, selectedDate],
  );

  const localItemCount = localGroup?.items?.length || 0;
  const shouldFetchDayEntries = shouldFetchHomeDayAttachments({
    enabled,
    localItemCount,
    proofsCount,
    entriesApiEnabled,
    organizationId,
    actorUserId,
    storeId,
    selectedDate,
  });

  const [fetchedDayEntries, setFetchedDayEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (!shouldFetchDayEntries) {
      setFetchedDayEntries([]);
      setLoading(false);
      setFetchError(false);
      return undefined;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setFetchError(false);
      try {
        const items = await fetchStoreEntriesViaApi({
          organizationId,
          actorUserId,
          actorRole,
          storeId,
          dateFrom: selectedDate,
          dateTo: selectedDate,
          status: "active",
          limit: 200,
        });
        if (!cancelled) {
          setFetchedDayEntries(Array.isArray(items) ? items : []);
        }
      } catch (error) {
        console.warn("home day attachments fetch failed", error);
        if (!cancelled) {
          setFetchedDayEntries([]);
          setFetchError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [
    actorRole,
    actorUserId,
    organizationId,
    refreshKey,
    selectedDate,
    shouldFetchDayEntries,
    storeId,
  ]);

  const fetchedGroup = useMemo(
    () => resolveAttachmentGroupForDate(attachmentsFromEntries(fetchedDayEntries), selectedDate),
    [fetchedDayEntries, selectedDate],
  );

  const group = localItemCount > 0 ? localGroup : fetchedGroup;
  const itemCount = group?.items?.length || 0;

  return {
    group,
    loading: shouldFetchDayEntries && loading,
    fetchError,
    itemCount,
  };
}
