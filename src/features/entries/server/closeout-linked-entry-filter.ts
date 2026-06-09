import { and, eq, exists, isNotNull, type SQL } from "drizzle-orm";
import { isEntriesApiDbSourceMode } from "@/core/config/entries-api-mode";
import { getDb } from "@/core/db/client";
import { dailyCloseouts, entries } from "@/core/db/schema";

export function closeoutLinkedEntryScope(
  organizationId: string,
  storeId: string,
): SQL | undefined {
  if (!isEntriesApiDbSourceMode()) return undefined;

  const db = getDb();
  return and(
    isNotNull(entries.closeoutId),
    exists(
      db
        .select({ id: dailyCloseouts.id })
        .from(dailyCloseouts)
        .where(
          and(
            eq(dailyCloseouts.id, entries.closeoutId),
            eq(dailyCloseouts.organizationId, organizationId),
            eq(dailyCloseouts.storeId, storeId),
            eq(dailyCloseouts.status, "approved"),
          ),
        ),
    ),
  );
}

export function mergeEntryScopeWithCloseoutLink(
  organizationId: string,
  storeId: string,
  scope: SQL | undefined,
): SQL | undefined {
  const linked = closeoutLinkedEntryScope(organizationId, storeId);
  if (!linked) return scope;
  return scope ? and(scope, linked) : linked;
}

type CloseoutMeta = { status: string };

export function includeListedEntryRow(
  row: { closeoutId: string | null },
  closeoutMetaById: Map<string, CloseoutMeta>,
): boolean {
  if (!row.closeoutId) {
    return !isEntriesApiDbSourceMode();
  }
  return closeoutMetaById.get(row.closeoutId)?.status === "approved";
}
