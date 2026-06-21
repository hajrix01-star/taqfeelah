import type { QueryClient } from "@tanstack/react-query";
import { operationalQueryKeys } from "./operational-query-keys";

export type OperationalInvalidationScope =
  | "register"
  | "closeouts"
  | "reports"
  | "summary"
  | "homeAttachments"
  | "duplicateWatch";

export const OPERATIONAL_SCOPES_AFTER_FINANCIAL_WRITE: OperationalInvalidationScope[] = [
  "register",
  "closeouts",
  "reports",
  "summary",
  "homeAttachments",
  "duplicateWatch",
];

export type InvalidateOperationalDataOptions = {
  scopes?: OperationalInvalidationScope[] | "all";
};

function scopeQueryKey(scope: OperationalInvalidationScope) {
  switch (scope) {
    case "register":
      return operationalQueryKeys.registerEntriesPrefix();
    case "closeouts":
      return operationalQueryKeys.closeoutsPrefix();
    case "reports":
      return operationalQueryKeys.reportsPrefix();
    case "summary":
      return operationalQueryKeys.summaryPrefix();
    case "homeAttachments":
      return operationalQueryKeys.homeAttachmentsPrefix();
    case "duplicateWatch":
      return [...operationalQueryKeys.all, "entries-duplicate-watch"] as const;
    default:
      return operationalQueryKeys.all;
  }
}

/**
 * Unified post-mutation / pull-to-refresh invalidation for owner operational data.
 */
export async function invalidateOperationalData(
  queryClient: QueryClient,
  options: InvalidateOperationalDataOptions = {},
) {
  const scopes = options.scopes ?? "all";
  if (scopes === "all") {
    await queryClient.invalidateQueries({ queryKey: operationalQueryKeys.all });
    return;
  }

  const uniqueScopes = [...new Set(scopes)];
  await Promise.all(
    uniqueScopes.map((scope) => queryClient.invalidateQueries({ queryKey: scopeQueryKey(scope) })),
  );
}

/**
 * Best-effort invalidation after a successful write — must not fail the user flow.
 */
export async function invalidateOperationalDataBestEffort(
  queryClient: QueryClient,
  options: InvalidateOperationalDataOptions = {},
) {
  try {
    await invalidateOperationalData(queryClient, options);
    return { refreshFailed: false };
  } catch (error) {
    console.warn("operational data invalidation failed after successful write", error);
    return {
      refreshFailed: true,
      refreshError: error,
    };
  }
}
