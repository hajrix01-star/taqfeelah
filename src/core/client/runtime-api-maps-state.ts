import { buildSalesChannelIdMap } from "@/core/client/sales-channel-catalog";
import { isUuid, mapToUuid, parseJsonMap } from "@/core/client/api-id-utils";
import type { RuntimeApiMapOverrides, RuntimeApiMaps } from "@/core/client/client-types";
import { bindsToServerAuth } from "@/core/config/runtime-capabilities";

let cachedMaps: RuntimeApiMaps | null = null;
let runtimeMapOverrides: RuntimeApiMapOverrides | null = null;

/** Merge runtime settings store/user/channel maps on top of build-time env maps. */
export function setRuntimeApiIdMaps(overrides: RuntimeApiMapOverrides | null | undefined): void {
  if (!overrides || typeof overrides !== "object") {
    runtimeMapOverrides = null;
    cachedMaps = null;
    return;
  }
  runtimeMapOverrides = {
    storeIdMap: overrides.storeIdMap && typeof overrides.storeIdMap === "object" ? overrides.storeIdMap : {},
    userIdMap: overrides.userIdMap && typeof overrides.userIdMap === "object" ? overrides.userIdMap : {},
    salesChannelIdMap: overrides.salesChannelIdMap && typeof overrides.salesChannelIdMap === "object"
      ? overrides.salesChannelIdMap
      : {},
  };
  cachedMaps = null;
}

export function getRuntimeApiMaps(): RuntimeApiMaps {
  if (cachedMaps) return cachedMaps;
  const envSalesChannelIdMap = parseJsonMap(process.env.NEXT_PUBLIC_CLOSEOUTS_SALES_CHANNEL_ID_MAP);
  cachedMaps = {
    storeIdMap: {
      ...parseJsonMap(process.env.NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP),
      ...(runtimeMapOverrides?.storeIdMap || {}),
    },
    userIdMap: {
      ...parseJsonMap(process.env.NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP),
      ...(runtimeMapOverrides?.userIdMap || {}),
    },
    salesChannelIdMap: {
      ...buildSalesChannelIdMap({
        envSalesChannelIdMap,
        includeCatalogDefaults: !bindsToServerAuth(),
      }),
      ...(runtimeMapOverrides?.salesChannelIdMap || {}),
    },
  };
  return cachedMaps;
}

export function hasRuntimeApiActorMapping(actorUserId: string): boolean {
  const { userIdMap } = getRuntimeApiMaps();
  return Boolean(mapToUuid(actorUserId, userIdMap));
}

export function hasRuntimeApiStoreMapping(storeId: string): boolean {
  const { storeIdMap } = getRuntimeApiMaps();
  return Boolean(mapToUuid(storeId, storeIdMap));
}

export function mapOrganizationId(organizationId: string): string {
  return isUuid(organizationId) ? organizationId : "";
}

export function mapActorUserId(actorUserId: string): string {
  const { userIdMap } = getRuntimeApiMaps();
  return mapToUuid(actorUserId, userIdMap);
}

export function mapStoreId(storeId: string): string {
  const { storeIdMap } = getRuntimeApiMaps();
  return mapToUuid(storeId, storeIdMap);
}

export function mapSalesChannelId(channelId: string): string {
  const { salesChannelIdMap } = getRuntimeApiMaps();
  return mapToUuid(channelId, salesChannelIdMap);
}
