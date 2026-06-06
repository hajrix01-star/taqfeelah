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
  status = "all",
}) {
  const { storeIdMap, userIdMap } = getMaps();
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
      legacyStaffId: reverseLookupKeyByUuid(member.userId, userIdMap) || member.userId,
      storeAccess: (member.storeAccess || []).map((row) => ({
        ...row,
        legacyStoreId: reverseLookupKeyByUuid(row.storeId, storeIdMap) || row.storeId,
      })),
    })),
  };
}

export async function createOrganizationStoreViaApi({
  organizationId,
  actorUserId,
  actorRole,
  name,
  location = "",
}) {
  const response = await fetch("/api/v1/stores", {
    method: "POST",
    headers: {
      ...authHeaders({ organizationId, actorUserId, actorRole }),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      name,
      location: location || undefined,
    }),
  });
  if (!response.ok) throw new Error(`store create api failed: ${response.status}`);
  const payload = await response.json();
  const store = payload?.store || payload;
  return {
    ...store,
    legacyId: store?.id,
  };
}

export async function updateStoreOperationalSettingsViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  patch,
  reason,
}) {
  const { storeIdMap } = getMaps();
  const mappedStoreId = mapToUuid(storeId, storeIdMap);
  if (!mappedStoreId) throw new Error("store operational settings api failed: missing store mapping");

  const response = await fetch(`/api/v1/stores/${mappedStoreId}/operational-settings`, {
    method: "PATCH",
    headers: {
      ...authHeaders({ organizationId, actorUserId, actorRole }),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      ...(patch || {}),
      ...(typeof reason === "string" && reason.trim() ? { reason: reason.trim() } : {}),
    }),
  });
  if (!response.ok) throw new Error(`store operational settings api failed: ${response.status}`);
  const payload = await response.json();
  return payload?.operationalSettings || payload;
}

export async function updateOrganizationStoreViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  name,
  location,
  status,
  reason,
}) {
  const { storeIdMap } = getMaps();
  const mappedStoreId = mapToUuid(storeId, storeIdMap);
  if (!mappedStoreId) throw new Error("store update api failed: missing store mapping");

  const body = {};
  if (typeof name === "string" && name.trim()) body.name = name.trim();
  if (location !== undefined) body.location = location;
  if (status === "active" || status === "archived") body.status = status;
  if (typeof reason === "string" && reason.trim()) body.reason = reason.trim();

  const response = await fetch(`/api/v1/stores/${mappedStoreId}`, {
    method: "PATCH",
    headers: {
      ...authHeaders({ organizationId, actorUserId, actorRole }),
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`store update api failed: ${response.status}`);
  const payload = await response.json();
  const store = payload?.store || payload;
  return {
    ...store,
    legacyId: reverseLookupKeyByUuid(store.id, storeIdMap) || storeId,
  };
}

export async function updateStoreSalesChannelViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  salesChannelId,
  status,
  reason,
}) {
  const { storeIdMap } = getMaps();
  const mappedStoreId = mapToUuid(storeId, storeIdMap);
  if (!mappedStoreId) throw new Error("sales channel update api failed: missing store mapping");
  if (!isUuid(salesChannelId)) throw new Error("sales channel update api failed: missing channel id");

  const response = await fetch(`/api/v1/stores/${mappedStoreId}/sales-channels`, {
    method: "PATCH",
    headers: {
      ...authHeaders({ organizationId, actorUserId, actorRole }),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      salesChannelId,
      status,
      reason,
    }),
  });
  if (!response.ok) throw new Error(`sales channel update api failed: ${response.status}`);
  const payload = await response.json();
  return payload?.channel || payload;
}

export async function createOrganizationMemberViaApi({
  organizationId,
  actorUserId,
  actorRole,
  name,
  role = "employee",
  storeIds = [],
  pin,
}) {
  const { storeIdMap } = getMaps();
  const mappedStoreIds = storeIds
    .map((storeId) => mapToUuid(storeId, storeIdMap))
    .filter((value) => isUuid(value));

  const body = {
    name,
    role,
    storeIds: mappedStoreIds,
  };
  if (typeof pin === "string" && pin.trim()) {
    body.credentials = { type: "employee_pin", pin: pin.trim() };
  }

  const response = await fetch("/api/v1/members", {
    method: "POST",
    headers: {
      ...authHeaders({ organizationId, actorUserId, actorRole }),
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`member create api failed: ${response.status}`);
  const payload = await response.json();
  return payload?.member || payload;
}

export async function updateOrganizationMemberViaApi({
  organizationId,
  actorUserId,
  actorRole,
  memberId,
  name,
  status,
  storeIds,
  pin,
  reason,
}) {
  if (!isUuid(memberId)) throw new Error("member update api failed: missing member id");

  const { storeIdMap } = getMaps();
  const body = {};
  if (typeof name === "string" && name.trim()) body.name = name.trim();
  if (status === "active" || status === "inactive") body.status = status;
  if (Array.isArray(storeIds)) {
    body.storeIds = storeIds
      .map((storeId) => mapToUuid(storeId, storeIdMap))
      .filter((value) => isUuid(value));
  }
  if (typeof pin === "string" && pin.trim()) {
    body.credentials = { type: "employee_pin", pin: pin.trim() };
  }
  if (typeof reason === "string" && reason.trim()) body.reason = reason.trim();

  const response = await fetch(`/api/v1/members/${memberId}`, {
    method: "PATCH",
    headers: {
      ...authHeaders({ organizationId, actorUserId, actorRole }),
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`member update api failed: ${response.status}`);
  const payload = await response.json();
  return payload?.member || payload;
}

export async function fetchOrgConfigBundleViaApi({
  organizationId,
  actorUserId,
  actorRole,
}) {
  const { stores } = await fetchOrganizationStoresViaApi({
    organizationId,
    actorUserId,
    actorRole,
    status: "all",
  });

  const channelResults = await Promise.all(
    stores.map((store) => fetchStoreSalesChannelsViaApi({
      organizationId,
      actorUserId,
      actorRole,
      storeId: store.legacyId || store.id,
      status: "all",
    })),
  );

  const channelsByStoreId = {};
  channelResults.forEach((result, index) => {
    const storeUuid = stores[index]?.id || result.storeId;
    channelsByStoreId[storeUuid] = result.channels || [];
  });

  const { members } = await fetchOrganizationMembersViaApi({
    organizationId,
    actorUserId,
    actorRole,
    status: "all",
  });

  return { stores, channelsByStoreId, members };
}
