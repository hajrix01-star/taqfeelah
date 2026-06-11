import type { QueryClient } from "@tanstack/react-query";
import { operationalQueryKeys } from "./operational-query-keys";

/**
 * Unified post-mutation / pull-to-refresh invalidation for owner operational data.
 */
export async function invalidateOperationalData(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: operationalQueryKeys.all });
}

/**
 * Best-effort invalidation after a successful write — must not fail the user flow.
 */
export async function invalidateOperationalDataBestEffort(queryClient: QueryClient) {
  try {
    await invalidateOperationalData(queryClient);
    return { refreshFailed: false };
  } catch (error) {
    console.warn("operational data invalidation failed after successful write", error);
    return {
      refreshFailed: true,
      refreshError: error,
    };
  }
}
