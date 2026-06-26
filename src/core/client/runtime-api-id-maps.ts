import { buildSalesChannelIdMap } from "@/core/client/sales-channel-catalog";
import { isUuid } from "@/core/client/api-id-utils";

type RuntimeBusiness = {
  id?: string;
  dbStoreId?: string;
  legacyId?: string;
};

type RuntimeStaff = {
  id?: string;
  apiUserId?: string;
  legacyId?: string;
};

type RuntimeChannel = {
  id?: string;
  legacyId?: string;
  apiChannelId?: string;
};

type StoreChannelSettings = Record<string, {
  channels?: RuntimeChannel[];
  activeIds?: string[];
} | undefined>;

type BuildRuntimeApiIdMapsInput = {
  configuredBusinesses?: RuntimeBusiness[];
  staff?: RuntimeStaff[];
  storeChannelSettings?: StoreChannelSettings;
  envStoreIdMap?: Record<string, string>;
  envUserIdMap?: Record<string, string>;
  envSalesChannelIdMap?: Record<string, string>;
  includeCatalogDefaults?: boolean;
};

/**
 * Merge env seed maps with runtime settings so custom store/staff IDs reach the DB API.
 */
export function buildRuntimeApiIdMaps({
  configuredBusinesses = [],
  staff = [],
  storeChannelSettings = {},
  envStoreIdMap = {},
  envUserIdMap = {},
  envSalesChannelIdMap = {},
  includeCatalogDefaults = true,
}: BuildRuntimeApiIdMapsInput = {}) {
  const storeIdMap: Record<string, string> = { ...envStoreIdMap };
  const userIdMap: Record<string, string> = { ...envUserIdMap };

  for (const person of staff) {
    const canonicalId = typeof person?.id === "string" ? person.id.trim() : "";
    const legacyId = typeof person?.legacyId === "string" ? person.legacyId.trim() : "";
    const apiUserId = (typeof person?.apiUserId === "string" ? person.apiUserId.trim() : "") || canonicalId;
    if (legacyId && isUuid(apiUserId)) {
      userIdMap[legacyId] = apiUserId;
    }
    if (canonicalId && !isUuid(canonicalId) && isUuid(apiUserId)) {
      userIdMap[canonicalId] = apiUserId;
    }
  }

  const seededStoreUuids = [...new Set(Object.values(envStoreIdMap).filter((value) => isUuid(value)))];
  const businesses = Array.isArray(configuredBusinesses) ? configuredBusinesses : [];

  for (const business of businesses) {
    const canonicalId = typeof business?.id === "string" ? business.id.trim() : "";
    if (isUuid(canonicalId)) {
      storeIdMap[canonicalId] = canonicalId;
    }
    const explicitLegacyId = typeof business?.legacyId === "string" ? business.legacyId.trim() : "";
    const legacyStoreId = explicitLegacyId || (canonicalId && !isUuid(canonicalId) ? canonicalId : "");
    if (!legacyStoreId) continue;
    if (isUuid(storeIdMap[legacyStoreId])) continue;

    const configuredDbStoreId = (typeof business?.dbStoreId === "string" ? business.dbStoreId.trim() : "") || canonicalId;
    if (isUuid(configuredDbStoreId)) {
      storeIdMap[legacyStoreId] = configuredDbStoreId;
      continue;
    }

    // Local single-store compatibility: owner renamed store keeps custom id in UI.
    if (businesses.length === 1 && seededStoreUuids.length === 1) {
      storeIdMap[legacyStoreId] = seededStoreUuids[0]!;
    }
  }

  const salesChannelIdMap = buildSalesChannelIdMap({
    envSalesChannelIdMap,
    storeChannelSettings,
    includeCatalogDefaults,
  });

  return { storeIdMap, userIdMap, salesChannelIdMap };
}
