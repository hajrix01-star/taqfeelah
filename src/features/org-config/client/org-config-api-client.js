import {
  getCloseoutApiMaps,
  setRuntimeApiIdMaps,
} from "@/features/closeouts/client/closeouts-api-client.js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let cachedMaps = null;

export function setOrgConfigRuntimeApiIdMaps(overrides) {
  setRuntimeApiIdMaps(overrides);
  cachedMaps = null;
}

function isUuid(value) {
  return typeof value === "string" && uuidPattern.test(value);
}

function getMaps() {
  if (cachedMaps) return cachedMaps;
  cachedMaps = getCloseoutApiMaps();
  return cachedMaps;
}

function mapToUuid(value, map) {
  if (isUuid(value)) return value;
  if (typeof value !== "string" || !value.trim()) return "";
  const mapped = map[value] || map[value.trim()];
  return isUuid(mapped) ? mapped : "";
}

function reverseLookupKeyByUuid(uuidValue, map) {
  if (!isUuid(uuidValue) || !map || typeof map !== "object") return "";
  for (const [key, value] of Object.entries(map)) {
    if (isUuid(value) && value.toLowerCase() === uuidValue.toLowerCase()) return key;
  }
  return "";
}

function authHeaders({ organizationId, actorUserId, actorRole }) {
  const { userIdMap } = getMaps();
  const mappedOrganizationId = isUuid(organizationId) ? organizationId : "";
  const mappedActorUserId = mapToUuid(actorUserId, userIdMap);
  return {
    "x-organization-id": mappedOrganizationId,
    "x-user-id": mappedActorUserId,
    "x-member-role": actorRole,
  };
}

export async function fetchOrganizationStoresViaApi({
  organizationId,
  actorUserId,
  actorRole,
  status = "active",
}) {
  const { storeIdMap } = getMaps();
  const search = new URLSearchParams({ status });
  const response = await fetch(`/api/v1/stores?${search.toString()}`, {
    method: "GET",
    headers: authHeaders({ organizationId, actorUserId, actorRole }),
  });
  if (!response.ok) throw new Error(`stores list api failed: ${response.status}`);
  const payload = await response.json();
  const stores = Array.isArray(payload?.stores) ? payload.stores : [];
  return {
    stores: stores.map((store) => ({
      ...store,
      legacyId: reverseLookupKeyByUuid(store.id, storeIdMap) || store.id,
    })),
  };
}

export async function fetchStoreSalesChannelsViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  status = "all",
}) {
  const { storeIdMap, salesChannelIdMap } = getMaps();
  const mappedStoreId = mapToUuid(storeId, storeIdMap);
  if (!mappedStoreId) return { storeId, channels: [] };

  const search = new URLSearchParams({ status });
  const response = await fetch(`/api/v1/stores/${mappedStoreId}/sales-channels?${search.toString()}`, {
    method: "GET",
    headers: authHeaders({ organizationId, actorUserId, actorRole }),
  });
  if (!response.ok) throw new Error(`sales channels api failed: ${response.status}`);
  const payload = await response.json();
  const channels = Array.isArray(payload?.channels) ? payload.channels : [];
  return {
    storeId,
    channels: channels.map((channel) => ({
      ...channel,
      legacyId: reverseLookupKeyByUuid(channel.id, salesChannelIdMap) || channel.id,
    })),
  };
}

export async function fetchOrganizationMembersViaApi({
  organizationId,
  actorUserId,
  actorRole,
  status = "active",
}) {
  const { storeIdMap } = getMaps();
  const search = new URLSearchParams({ status });
  const response = await fetch(`/api/v1/members?${search.toString()}`, {
    method: "GET",
    headers: authHeaders({ organizationId, actorUserId, actorRole }),
  });
  if (!response.ok) throw new Error(`members list api failed: ${response.status}`);
  const payload = await response.json();
  const members = Array.isArray(payload?.members) ? payload.members : [];
  return {
    members: members.map((member) => ({
      ...member,
      storeAccess: (member.storeAccess || []).map((row) => ({
        ...row,
        legacyStoreId: reverseLookupKeyByUuid(row.storeId, storeIdMap) || row.storeId,
      })),
    })),
  };
}
