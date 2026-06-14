import { OPERATIONAL_SCOPES_AFTER_FINANCIAL_WRITE } from "@/core/client/invalidate-operational-data";

/**
 * Post-write refresh must not fail the user-facing save/submit when the write already succeeded.
 */
export async function refreshOperationalEntriesBestEffort(loadOperationalEntriesFromApi) {
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
