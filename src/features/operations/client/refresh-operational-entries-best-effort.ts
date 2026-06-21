import { OPERATIONAL_SCOPES_AFTER_FINANCIAL_WRITE } from "@/core/client/invalidate-operational-data";
import type { LoadOperationalEntriesFn, RefreshOperationalEntriesResult } from "./operations-client-types";

export async function refreshOperationalEntriesBestEffort(
  loadOperationalEntriesFromApi: LoadOperationalEntriesFn | null | undefined,
): Promise<RefreshOperationalEntriesResult> {
  if (typeof loadOperationalEntriesFromApi !== "function") {
    return { refreshed: [], refreshFailed: false };
  }
  try {
    const refreshed = await loadOperationalEntriesFromApi({
      invalidateScopes: OPERATIONAL_SCOPES_AFTER_FINANCIAL_WRITE,
    });
    return {
      refreshed: Array.isArray(refreshed) ? refreshed : [],
      refreshFailed: false,
    };
  } catch (error) {
    console.warn("operational entries refresh failed after successful write", error);
    return {
      refreshed: [],
      refreshFailed: true,
      refreshError: error,
    };
  }
}
