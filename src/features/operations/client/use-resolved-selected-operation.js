"use client";

import { useMemo } from "react";

/**
 * @param {object | null | undefined} selected
 * @param {Array<Array<object>>} catalogs
 */
export function resolveSelectedOperation(selected, catalogs = []) {
  if (!selected?.id) return selected ?? null;
  for (const catalog of catalogs) {
    if (!Array.isArray(catalog)) continue;
    const fresh = catalog.find((entry) => entry.id === selected.id);
    if (fresh) return fresh;
  }
  return selected;
}

/**
 * Resolve a frozen operation snapshot against the freshest entry catalogs.
 *
 * @param {object | null | undefined} selected
 * @param {Array<Array<object>>} catalogs
 */
export function useResolvedSelectedOperation(selected, catalogs = []) {
  return useMemo(
    () => resolveSelectedOperation(selected, catalogs),
    [catalogs, selected],
  );
}
