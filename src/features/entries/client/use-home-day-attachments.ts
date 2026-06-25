"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { attachmentsFromEntries } from "@/components/prototype-runtime/prototype-runtime-demo-operational-entries";
import { operationalQueryKeys } from "@/core/client/operational-query-keys";
import { fetchStoreEntriesViaApi } from "./store-entries-api-client";
import { resolveAttachmentGroupForDate } from "./attachments-from-entries";
import type { HomeAttachmentGroup, OperationalEntry } from "./entries-client-types";

export function shouldFetchHomeDayAttachments({
  enabled = false,
  localItemCount = 0,
  proofsCount = 0,
  entriesApiEnabled = false,
  organizationId = "",
  actorUserId = "",
  storeId = "",
  selectedDate = "",
  strictServerSource = false,
} = {}): boolean {
  return enabled
    && entriesApiEnabled
    && Boolean(storeId)
    && Boolean(selectedDate)
    && Boolean(organizationId)
    && Boolean(actorUserId)
    && (strictServerSource ? proofsCount > 0 : proofsCount > localItemCount);
}

export function resolveHomeDayAttachmentGroupFromServer({
  fetchedGroup = null,
  shouldFetchDayEntries = false,
  fetchSucceeded = false,
}: {
  fetchedGroup?: HomeAttachmentGroup;
  shouldFetchDayEntries?: boolean;
  fetchSucceeded?: boolean;
} = {}): HomeAttachmentGroup {
  if (!shouldFetchDayEntries) return null;
  return fetchSucceeded ? fetchedGroup : null;
}

export function resolveHomeDayAttachmentGroupFromLocal({
  demoLocalGroup = null,
  fetchedGroup = null,
  shouldFetchDayEntries = false,
  fetchSucceeded = false,
  fetchFailed = false,
}: {
  demoLocalGroup?: HomeAttachmentGroup;
  fetchedGroup?: HomeAttachmentGroup;
  shouldFetchDayEntries?: boolean;
  fetchSucceeded?: boolean;
  fetchFailed?: boolean;
} = {}): HomeAttachmentGroup {
  const localItemCount = demoLocalGroup?.items?.length || 0;
  const fetchedItemCount = fetchedGroup?.items?.length || 0;

  if (shouldFetchDayEntries) {
    if (fetchSucceeded) return fetchedGroup;
    if (fetchFailed && localItemCount > 0) return demoLocalGroup;
    return fetchedGroup;
  }

  if (fetchedItemCount > localItemCount) return fetchedGroup;
  if (localItemCount > 0) return demoLocalGroup;
  return fetchedGroup;
}

export function useHomeDayAttachments({
  enabled = false,
  localDayEntries = [] as OperationalEntry[],
  selectedDate = "",
  proofsCount = 0,
  entriesApiEnabled = false,
  organizationId = "",
  actorUserId = "",
  actorRole = "owner",
  storeId = "",
}: {
  enabled?: boolean;
  localDayEntries?: OperationalEntry[];
  selectedDate?: string;
  proofsCount?: number;
  entriesApiEnabled?: boolean;
  organizationId?: string;
  actorUserId?: string;
  actorRole?: string;
  storeId?: string;
} = {}) {
  const demoLocalGroup = useMemo(
    () => (entriesApiEnabled ? null : resolveAttachmentGroupForDate(attachmentsFromEntries(localDayEntries), selectedDate)),
    [entriesApiEnabled, localDayEntries, selectedDate],
  );

  const localItemCount = demoLocalGroup?.items?.length || 0;
  const shouldFetchDayEntries = shouldFetchHomeDayAttachments({
    enabled,
    localItemCount,
    proofsCount,
    entriesApiEnabled,
    organizationId,
    actorUserId,
    storeId,
    selectedDate,
    strictServerSource: entriesApiEnabled,
  });

  const query = useQuery({
    queryKey: operationalQueryKeys.homeAttachments({
      organizationId,
      actorUserId,
      actorRole,
      storeId,
      selectedDate,
    }),
    queryFn: async () => {
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
      return Array.isArray(items) ? items : [];
    },
    enabled: shouldFetchDayEntries,
  });

  const loading = shouldFetchDayEntries && query.isPending;
  const fetchError = shouldFetchDayEntries && query.isError;

  const fetchedGroup = useMemo(() => {
    const fetchedDayEntries = shouldFetchDayEntries ? (query.data ?? []) : [];
    return resolveAttachmentGroupForDate(attachmentsFromEntries(fetchedDayEntries), selectedDate);
  }, [query.data, selectedDate, shouldFetchDayEntries]);

  const group = entriesApiEnabled
    ? resolveHomeDayAttachmentGroupFromServer({
      fetchedGroup,
      shouldFetchDayEntries,
      fetchSucceeded: shouldFetchDayEntries && query.isSuccess,
    })
    : resolveHomeDayAttachmentGroupFromLocal({
      demoLocalGroup,
      fetchedGroup,
      shouldFetchDayEntries,
      fetchSucceeded: shouldFetchDayEntries && query.isSuccess,
      fetchFailed: shouldFetchDayEntries && query.isError,
    });
  const itemCount = group?.items?.length || 0;

  return {
    group,
    loading,
    fetchError,
    itemCount,
  };
}
