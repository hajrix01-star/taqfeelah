"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
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
} = {}): boolean {
  return enabled
    && entriesApiEnabled
    && Boolean(storeId)
    && Boolean(selectedDate)
    && Boolean(organizationId)
    && Boolean(actorUserId)
    && proofsCount > localItemCount;
}

export function resolveHomeDayAttachmentGroup({
  localGroup = null,
  fetchedGroup = null,
  shouldFetchDayEntries = false,
  fetchSucceeded = false,
  fetchFailed = false,
}: {
  localGroup?: HomeAttachmentGroup;
  fetchedGroup?: HomeAttachmentGroup;
  shouldFetchDayEntries?: boolean;
  fetchSucceeded?: boolean;
  fetchFailed?: boolean;
} = {}): HomeAttachmentGroup {
  const localItemCount = localGroup?.items?.length || 0;
  const fetchedItemCount = fetchedGroup?.items?.length || 0;

  if (shouldFetchDayEntries) {
    if (fetchSucceeded) return fetchedGroup;
    if (fetchFailed && localItemCount > 0) return localGroup;
    return fetchedGroup;
  }

  if (fetchedItemCount > localItemCount) return fetchedGroup;
  if (localItemCount > 0) return localGroup;
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
    placeholderData: keepPreviousData,
  });

  const loading = shouldFetchDayEntries && query.isPending && !query.isPlaceholderData;
  const fetchError = shouldFetchDayEntries && query.isError;

  const fetchedGroup = useMemo(() => {
    const fetchedDayEntries = shouldFetchDayEntries ? (query.data ?? []) : [];
    return resolveAttachmentGroupForDate(attachmentsFromEntries(fetchedDayEntries), selectedDate);
  }, [query.data, selectedDate, shouldFetchDayEntries]);

  const group = resolveHomeDayAttachmentGroup({
    localGroup,
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
