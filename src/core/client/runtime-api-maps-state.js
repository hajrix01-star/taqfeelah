import { buildSalesChannelIdMap } from "@/core/client/sales-channel-catalog";
import { isUuid, mapToUuid, parseJsonMap } from "@/core/client/api-id-utils";

let cachedMaps = null;
let runtimeMapOverrides = null;

/** Merge runtime settings store/user/channel maps on top of build-time env maps. */
export function setRuntimeApiIdMaps(overrides) {
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

export function getRuntimeApiMaps() {
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
      ...buildSalesChannelIdMap({ envSalesChannelIdMap }),
      ...(runtimeMapOverrides?.salesChannelIdMap || {}),
    },
  };
  return cachedMaps;
}

/** @deprecated Use getRuntimeApiMaps — kept for existing imports. */
export function getCloseoutApiMaps() {
  return getRuntimeApiMaps();
}

export function hasRuntimeApiActorMapping(actorUserId) {
  const { userIdMap } = getRuntimeApiMaps();
  return Boolean(mapToUuid(actorUserId, userIdMap));
}

/** @deprecated Use hasRuntimeApiActorMapping */
export function hasCloseoutApiActorMapping(actorUserId) {
  return hasRuntimeApiActorMapping(actorUserId);
}

export function hasRuntimeApiStoreMapping(storeId) {
  const { storeIdMap } = getRuntimeApiMaps();
  return Boolean(mapToUuid(storeId, storeIdMap));
}

/** @deprecated Use hasRuntimeApiStoreMapping */
export function hasCloseoutApiStoreMapping(storeId) {
  return hasRuntimeApiStoreMapping(storeId);
}

export function mapOrganizationId(organizationId) {
  return isUuid(organizationId) ? organizationId : "";
}

export function mapActorUserId(actorUserId) {
  const { userIdMap } = getRuntimeApiMaps();
  return mapToUuid(actorUserId, userIdMap);
}

export function mapStoreId(storeId) {
  const { storeIdMap } = getRuntimeApiMaps();
  return mapToUuid(storeId, storeIdMap);
}

export function mapSalesChannelId(channelId) {
  const { salesChannelIdMap } = getRuntimeApiMaps();
  return mapToUuid(channelId, salesChannelIdMap);
}
