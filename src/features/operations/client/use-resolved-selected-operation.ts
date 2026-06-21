"use client";

import { useMemo } from "react";
import type { OperationalEntry } from "@/features/entries/client/entries-client-types";

export function resolveSelectedOperation(
  selected: OperationalEntry | null | undefined,
  catalogs: OperationalEntry[][] = [],
): OperationalEntry | null {
  if (!selected?.id) return selected ?? null;
  for (const catalog of catalogs) {
    if (!Array.isArray(catalog)) continue;
    const fresh = catalog.find((entry) => entry.id === selected.id);
    if (fresh) return fresh;
  }
  return selected;
}

export function useResolvedSelectedOperation(
  selected: OperationalEntry | null | undefined,
  catalogs: OperationalEntry[][] = [],
): OperationalEntry | null {
  return useMemo(
    () => resolveSelectedOperation(selected, catalogs),
    [catalogs, selected],
  );
}
