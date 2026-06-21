"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import { operationalQueryKeys } from "@/core/client/operational-query-keys";
import type { OperationalEntry } from "@/features/entries/client/entries-client-types";

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

export function useRegisterEntriesCatalog(): OperationalEntry[] {
  const queryClient = useQueryClient();

  return useSyncExternalStore(
    (onStoreChange) => queryClient.getQueryCache().subscribe(onStoreChange),
    () => readRegisterEntriesCatalog(queryClient),
    () => [] as OperationalEntry[],
  );
}
