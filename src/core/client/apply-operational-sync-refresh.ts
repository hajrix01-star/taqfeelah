import type { QueryClient } from "@tanstack/react-query";
import {
  invalidateOperationalDataBestEffort,
  type OperationalInvalidationScope,
} from "@/core/client/invalidate-operational-data";

export type ApplyOperationalSyncRefreshInput = {
  queryClient: QueryClient;
  invalidateScopes: OperationalInvalidationScope[] | "all";
  reloadCloseouts?: () => Promise<unknown>;
  reloadEntries?: () => Promise<unknown>;
  reloadCloseoutsEnabled?: boolean;
  reloadEntriesEnabled?: boolean;
};

export async function applyOperationalSyncRefresh({
  queryClient,
  invalidateScopes,
  reloadCloseouts,
  reloadEntries,
  reloadCloseoutsEnabled = true,
  reloadEntriesEnabled = true,
}: ApplyOperationalSyncRefreshInput): Promise<{ refreshFailed: boolean }> {
  const invalidation = await invalidateOperationalDataBestEffort(queryClient, {
    scopes: invalidateScopes,
  });

  const tasks: Promise<unknown>[] = [];
  if (reloadCloseoutsEnabled && typeof reloadCloseouts === "function") {
    tasks.push(
      reloadCloseouts().catch((error) => {
        console.warn("operational sync closeouts reload failed", error);
        throw error;
      }),
    );
  }
  if (reloadEntriesEnabled && typeof reloadEntries === "function") {
    tasks.push(
      reloadEntries().catch((error) => {
        console.warn("operational sync entries reload failed", error);
        throw error;
      }),
    );
  }

  let reloadFailed = false;
  if (tasks.length > 0) {
    const results = await Promise.allSettled(tasks);
    reloadFailed = results.some((result) => result.status === "rejected");
  }

  return {
    refreshFailed: invalidation.refreshFailed || reloadFailed,
  };
}
