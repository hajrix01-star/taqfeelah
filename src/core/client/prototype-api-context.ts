import {
  mapActorUserId,
  mapOrganizationId,
  mapSalesChannelId,
  mapStoreId,
} from "@/core/client/runtime-api-maps-state";
import { reverseLookupKeyByUuid } from "@/core/client/api-id-utils";
import type { ResolvePrototypeApiContextInput, ResolvedPrototypeApiContext } from "@/core/client/client-types";
import { getRuntimeApiMaps } from "@/core/client/runtime-api-maps-state";

export function resolvePrototypeApiContext({
  organizationId = "",
  actorUserId = "",
  actorRole = "",
  storeId = "",
}: ResolvePrototypeApiContextInput = {}): ResolvedPrototypeApiContext | null {
  const mappedOrganizationId = mapOrganizationId(organizationId);
  const mappedActorUserId = mapActorUserId(actorUserId);
  const mappedStoreId = storeId ? mapStoreId(storeId) : "";
  if (!mappedOrganizationId || !mappedActorUserId) {
    return null;
  }
  if (storeId && !mappedStoreId) {
    return null;
  }
  return {
    organizationId: mappedOrganizationId,
    actorUserId: mappedActorUserId,
    actorRole,
    storeId: mappedStoreId,
  };
}

export function legacyIdForStore(uuidValue: string): string {
  const { storeIdMap } = getRuntimeApiMaps();
  return reverseLookupKeyByUuid(uuidValue, storeIdMap) || uuidValue;
}

export function legacyIdForUser(uuidValue: string): string {
  const { userIdMap } = getRuntimeApiMaps();
  return reverseLookupKeyByUuid(uuidValue, userIdMap) || uuidValue;
}

export function legacyIdForSalesChannel(uuidValue: string): string {
  const { salesChannelIdMap } = getRuntimeApiMaps();
  return reverseLookupKeyByUuid(uuidValue, salesChannelIdMap) || uuidValue;
}

export function mapChannelIdToUuid(channelId: string): string {
  return mapSalesChannelId(channelId);
}
