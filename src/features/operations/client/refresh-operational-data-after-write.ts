import type { QueryClient } from "@tanstack/react-query";
import {
  invalidateOperationalDataBestEffort,
  OPERATIONAL_SCOPES_AFTER_FINANCIAL_WRITE,
} from "@/core/client/invalidate-operational-data";
import type {
  LoadOperationalEntriesFn,
  RefreshOperationalEntriesResult,
} from "./operations-client-types";

/**
 * Unified post-write refresh: invalidate closeouts + register (+ reports/summary) via React Query.
 */
export async function refreshOperationalDataAfterWrite(
  queryClient: QueryClient,
  loadOperationalEntriesFromApi?: LoadOperationalEntriesFn | null,
): Promise<RefreshOperationalEntriesResult> {
  const invalidation = await invalidateOperationalDataBestEffort(queryClient, {
    scopes: OPERATIONAL_SCOPES_AFTER_FINANCIAL_WRITE,
  });

  if (typeof loadOperationalEntriesFromApi !== "function") {
    return {
      refreshed: [],
      refreshFailed: invalidation.refreshFailed,
    };
  }

  try {
    const refreshed = await loadOperationalEntriesFromApi({ invalidateScopes: [] });
    return {
      refreshed: Array.isArray(refreshed) ? refreshed : [],
      refreshFailed: invalidation.refreshFailed,
    };
  } catch (error) {
    console.warn("operational entries reload failed after successful write", error);
    return {
      refreshed: [],
      refreshFailed: true,
      refreshError: error,
    };
  }
}
