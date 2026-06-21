"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRef, useSyncExternalStore } from "react";
import { operationalQueryKeys } from "@/core/client/operational-query-keys";
import type { OperationalEntry } from "@/features/entries/client/entries-client-types";
import type { RegisterEntriesCatalogCache } from "./operations-client-types";

function readRegisterEntriesCatalog(queryClient: ReturnType<typeof useQueryClient>): OperationalEntry[] {
  const merged: OperationalEntry[] = [];
  const seen = new Set<string>();
  queryClient.getQueriesData<{ entries?: OperationalEntry[] }>({
    queryKey: operationalQueryKeys.registerEntriesPrefix(),
  }).forEach(([, data]) => {
    const entries = data?.entries;
    if (!Array.isArray(entries)) return;
    entries.forEach((entry) => {
      const entryId = typeof entry?.id === "string" ? entry.id : "";
      if (!entryId || seen.has(entryId)) return;
      seen.add(entryId);
      merged.push(entry);
    });
  });
  return merged;
}

function catalogSnapshotKey(catalog: OperationalEntry[]): string {
  return catalog.map((entry) => {
    const entryId = typeof entry?.id === "string" ? entry.id : "";
    const enteredBy = typeof entry?.enteredBy?.userId === "string" ? entry.enteredBy.userId : "";
    const ownerEditedAt = typeof entry?.closeoutOwnerEditedAt === "string" ? entry.closeoutOwnerEditedAt : "";
    return `${entryId}:${enteredBy}:${ownerEditedAt}`;
  }).join("|");
}

export function useRegisterEntriesCatalog(): OperationalEntry[] {
  const queryClient = useQueryClient();
  const cacheRef = useRef<RegisterEntriesCatalogCache>({ key: "", value: [] });

  return useSyncExternalStore(
    (onStoreChange) => queryClient.getQueryCache().subscribe(onStoreChange),
    () => {
      const next = readRegisterEntriesCatalog(queryClient);
      const key = catalogSnapshotKey(next);
      if (key === cacheRef.current.key) {
        return cacheRef.current.value;
      }
      cacheRef.current = { key, value: next };
      return next;
    },
    () => [] as OperationalEntry[],
  );
}
