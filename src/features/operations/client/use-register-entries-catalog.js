"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRef, useSyncExternalStore } from "react";
import { operationalQueryKeys } from "@/core/client/operational-query-keys";

function readRegisterEntriesCatalog(queryClient) {
  const merged = [];
  const seen = new Set();
  queryClient.getQueriesData({ queryKey: operationalQueryKeys.registerEntriesPrefix() }).forEach(([, data]) => {
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

function catalogSnapshotKey(catalog) {
  return catalog.map((entry) => {
    const entryId = typeof entry?.id === "string" ? entry.id : "";
    const enteredBy = typeof entry?.enteredBy?.userId === "string" ? entry.enteredBy.userId : "";
    const ownerEditedAt = typeof entry?.closeoutOwnerEditedAt === "string" ? entry.closeoutOwnerEditedAt : "";
    return `${entryId}:${enteredBy}:${ownerEditedAt}`;
  }).join("|");
}

export function useRegisterEntriesCatalog() {
  const queryClient = useQueryClient();
  const cacheRef = useRef({ key: "", value: [] });

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
    () => [],
  );
}
