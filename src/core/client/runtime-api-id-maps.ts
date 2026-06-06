import { isUuid } from "@/features/closeouts/client/closeouts-api-client";

type RuntimeBusiness = {
  id?: string;
  dbStoreId?: string;
};

type RuntimeStaff = {
  id?: string;
  apiUserId?: string;
};

type BuildRuntimeApiIdMapsInput = {
  configuredBusinesses?: RuntimeBusiness[];
  staff?: RuntimeStaff[];
  envStoreIdMap?: Record<string, string>;
  envUserIdMap?: Record<string, string>;
};

/**
 * Merge env seed maps with runtime settings so custom store/staff IDs reach the DB API.
 */
export function buildRuntimeApiIdMaps({
  configuredBusinesses = [],
  staff = [],
  envStoreIdMap = {},
  envUserIdMap = {},
}: BuildRuntimeApiIdMapsInput = {}) {
  const storeIdMap: Record<string, string> = { ...envStoreIdMap };
  const userIdMap: Record<string, string> = { ...envUserIdMap };

  for (const person of staff) {
    const legacyId = typeof person?.id === "string" ? person.id.trim() : "";
    const apiUserId = typeof person?.apiUserId === "string" ? person.apiUserId.trim() : "";
    if (legacyId && isUuid(apiUserId)) {
      userIdMap[legacyId] = apiUserId;
    }
  }

  const seededStoreUuids = [...new Set(Object.values(envStoreIdMap).filter((value) => isUuid(value)))];
  const businesses = Array.isArray(configuredBusinesses) ? configuredBusinesses : [];

  for (const business of businesses) {
    const legacyStoreId = typeof business?.id === "string" ? business.id.trim() : "";
    if (!legacyStoreId || isUuid(legacyStoreId)) continue;
    if (isUuid(storeIdMap[legacyStoreId])) continue;

    const configuredDbStoreId = typeof business?.dbStoreId === "string" ? business.dbStoreId.trim() : "";
    if (isUuid(configuredDbStoreId)) {
      storeIdMap[legacyStoreId] = configuredDbStoreId;
      continue;
    }

    // Prototype single-store fallback: owner renamed store keeps custom id in UI.
    if (businesses.length === 1 && seededStoreUuids.length === 1) {
      storeIdMap[legacyStoreId] = seededStoreUuids[0]!;
    }
  }

  return { storeIdMap, userIdMap };
}
