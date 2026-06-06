import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { stores } from "@/core/db/schema";

type RuntimeBusiness = {
  id?: string;
  dbStoreId?: string;
};

function isUuid(value: string): boolean {
  return z.string().uuid().safeParse(value).success;
}

/**
 * When env store maps are empty, map prototype custom store ids to the org's DB store.
 */
export async function enrichRuntimeStoreIdMap(
  organizationId: string,
  storeIdMap: Record<string, string>,
  configuredBusinesses: RuntimeBusiness[] = [],
): Promise<Record<string, string>> {
  const enriched: Record<string, string> = { ...storeIdMap };
  const businesses = configuredBusinesses.filter(
    (business) => typeof business?.id === "string" && business.id.trim(),
  );

  for (const business of businesses) {
    const legacyStoreId = business.id!.trim();
    if (isUuid(legacyStoreId) || isUuid(enriched[legacyStoreId] || "")) continue;
    const configuredDbStoreId = typeof business.dbStoreId === "string" ? business.dbStoreId.trim() : "";
    if (isUuid(configuredDbStoreId)) {
      enriched[legacyStoreId] = configuredDbStoreId;
    }
  }

  const unresolved = businesses.some((business) => {
    const legacyStoreId = business.id!.trim();
    return !isUuid(legacyStoreId) && !isUuid(enriched[legacyStoreId] || "");
  });
  if (!unresolved) return enriched;

  const db = getDb();
  const storeRows = await db
    .select({ id: stores.id })
    .from(stores)
    .where(and(eq(stores.organizationId, organizationId), eq(stores.status, "active")));

  if (storeRows.length === 1 && businesses.length === 1) {
    const legacyStoreId = businesses[0]!.id!.trim();
    if (!isUuid(legacyStoreId) && !isUuid(enriched[legacyStoreId] || "")) {
      enriched[legacyStoreId] = storeRows[0]!.id;
    }
  }

  return enriched;
}
