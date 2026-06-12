import { isUuid, mapToUuid, reverseLookupKeyByUuid } from "@/core/client/api-id-utils";
import { fetchApiJsonWithPrototypeContext } from "@/core/client/api-fetch";
import {
  getRuntimeApiMaps,
  setRuntimeApiIdMaps,
} from "@/core/client/runtime-api-maps-state";
import { resolvePrototypeApiContext } from "@/core/client/prototype-api-context";

export function setOrgConfigRuntimeApiIdMaps(overrides) {
  setRuntimeApiIdMaps(overrides);
}

function getMaps() {
  return getRuntimeApiMaps();
}

export async function fetchOrganizationStoresViaApi({
  organizationId,
  actorUserId,
  actorRole,
  status = "active",
}) {
  const { storeIdMap } = getMaps();
  const search = new URLSearchParams({ status });
  const payload = await fetchApiJsonWithPrototypeContext(`/api/v1/stores?${search.toString()}`, {
    organizationId,
    actorUserId,
    actorRole,
    errorMessage: "stores list api failed",
    errorStyle: "status",
  });
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
  const payload = await fetchApiJsonWithPrototypeContext(
    `/api/v1/stores/${mappedStoreId}/sales-channels?${search.toString()}`,
    {
      organizationId,
      actorUserId,
      actorRole,
      errorMessage: "sales channels api failed",
      errorStyle: "status",
    },
  );
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
  const payload = await fetchApiJsonWithPrototypeContext(`/api/v1/members?${search.toString()}`, {
    organizationId,
    actorUserId,
    actorRole,
    errorMessage: "members list api failed",
    errorStyle: "status",
  });
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
  const payload = await fetchApiJsonWithPrototypeContext("/api/v1/stores", {
    organizationId,
    actorUserId,
    actorRole,
    method: "POST",
    body: {
      name,
      location: location || undefined,
    },
    errorMessage: "store create api failed",
    errorStyle: "status",
  });
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
  const context = resolvePrototypeApiContext({ organizationId, actorUserId, actorRole, storeId });
  if (!context) throw new Error("store operational settings api failed: missing store mapping");

  const payload = await fetchApiJsonWithPrototypeContext(
    `/api/v1/stores/${context.storeId}/operational-settings`,
    {
      organizationId,
      actorUserId,
      actorRole,
      method: "PATCH",
      body: {
        ...(patch || {}),
        ...(typeof reason === "string" && reason.trim() ? { reason: reason.trim() } : {}),
      },
      errorMessage: "store operational settings api failed",
      errorStyle: "status",
    },
  );
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
  const context = resolvePrototypeApiContext({ organizationId, actorUserId, actorRole, storeId });
  if (!context) throw new Error("store update api failed: missing store mapping");

  const body = {};
  if (typeof name === "string" && name.trim()) body.name = name.trim();
  if (location !== undefined) body.location = location;
  if (status === "active" || status === "archived") body.status = status;
  if (typeof reason === "string" && reason.trim()) body.reason = reason.trim();

  const payload = await fetchApiJsonWithPrototypeContext(`/api/v1/stores/${context.storeId}`, {
    organizationId,
    actorUserId,
    actorRole,
    method: "PATCH",
    body,
    errorMessage: "store update api failed",
    errorStyle: "status",
  });
  const store = payload?.store || payload;
  return {
    ...store,
    legacyId: reverseLookupKeyByUuid(store.id, storeIdMap) || storeId,
  };
}

export async function createStoreSalesChannelViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  name,
  status = "active",
  reason,
}) {
  const context = resolvePrototypeApiContext({ organizationId, actorUserId, actorRole, storeId });
  if (!context) throw new Error("sales channel create api failed: missing store mapping");
  if (!name?.trim()) throw new Error("sales channel create api failed: missing channel name");

  const payload = await fetchApiJsonWithPrototypeContext(
    `/api/v1/stores/${context.storeId}/sales-channels`,
    {
      organizationId,
      actorUserId,
      actorRole,
      method: "POST",
      body: {
        name: name.trim(),
        status,
        reason,
      },
      errorMessage: "sales channel create api failed",
      errorStyle: "status",
    },
  );
  return payload?.channel || payload;
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
  const context = resolvePrototypeApiContext({ organizationId, actorUserId, actorRole, storeId });
  if (!context) throw new Error("sales channel update api failed: missing store mapping");
  if (!isUuid(salesChannelId)) throw new Error("sales channel update api failed: missing channel id");

  const payload = await fetchApiJsonWithPrototypeContext(
    `/api/v1/stores/${context.storeId}/sales-channels`,
    {
      organizationId,
      actorUserId,
      actorRole,
      method: "PATCH",
      body: {
        salesChannelId,
        status,
        reason,
      },
      errorMessage: "sales channel update api failed",
      errorStyle: "status",
    },
  );
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
  loginPhone,
}) {
  const { storeIdMap } = getMaps();
  const mappedStoreIds = storeIds
    .map((id) => mapToUuid(id, storeIdMap))
    .filter((value) => isUuid(value));

  const body = {
    name,
    role,
    storeIds: mappedStoreIds,
  };
  if (typeof pin === "string" && pin.trim()) {
    body.credentials = { type: "employee_pin", pin: pin.trim() };
  }
  if (typeof loginPhone === "string" && loginPhone.trim()) {
    body.loginPhone = loginPhone.trim();
  }

  const payload = await fetchApiJsonWithPrototypeContext("/api/v1/members", {
    organizationId,
    actorUserId,
    actorRole,
    method: "POST",
    body,
    errorMessage: "member create api failed",
    errorStyle: "status",
  });
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
  loginPhone,
  reason,
}) {
  if (!isUuid(memberId)) throw new Error("member update api failed: missing member id");

  const { storeIdMap } = getMaps();
  const body = {};
  if (typeof name === "string" && name.trim()) body.name = name.trim();
  if (status === "active" || status === "inactive") body.status = status;
  if (Array.isArray(storeIds)) {
    body.storeIds = storeIds
      .map((id) => mapToUuid(id, storeIdMap))
      .filter((value) => isUuid(value));
  }
  if (typeof pin === "string" && pin.trim()) {
    body.credentials = { type: "employee_pin", pin: pin.trim() };
  }
  if (typeof loginPhone === "string" && loginPhone.trim()) {
    body.loginPhone = loginPhone.trim();
  }
  if (typeof reason === "string" && reason.trim()) body.reason = reason.trim();

  const payload = await fetchApiJsonWithPrototypeContext(`/api/v1/members/${memberId}`, {
    organizationId,
    actorUserId,
    actorRole,
    method: "PATCH",
    body,
    errorMessage: "member update api failed",
    errorStyle: "status",
  });
  return payload?.member || payload;
}

async function fetchStoresAndChannelsBundleViaApi({
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

  return { stores, channelsByStoreId };
}

/** Stores + channels only — safe for employee role (no members list). */
export async function fetchEmployeeRuntimeBundleViaApi(auth) {
  return fetchStoresAndChannelsBundleViaApi(auth);
}

const orgConfigBundleInflight = new Map();

function buildOrgConfigBundleAuthKey({
  organizationId = "",
  actorUserId = "",
  actorRole = "",
} = {}) {
  return `${organizationId}|${actorUserId}|${actorRole}`;
}

async function fetchOrgConfigBundleViaApiImpl({
  organizationId,
  actorUserId,
  actorRole,
}) {
  const { stores, channelsByStoreId } = await fetchStoresAndChannelsBundleViaApi({
    organizationId,
    actorUserId,
    actorRole,
  });

  let members = [];
  if (actorRole === "owner" || actorRole === "manager") {
    const membersPayload = await fetchOrganizationMembersViaApi({
      organizationId,
      actorUserId,
      actorRole,
      status: "all",
    });
    members = membersPayload.members || [];
  } else {
    members = [{
      userId: actorUserId,
      legacyStaffId: actorUserId,
      role: "employee",
      status: "active",
      storeAccess: stores.map((store) => ({
        storeId: store.id,
        legacyStoreId: store.legacyId || store.id,
      })),
    }];
  }

  return { stores, channelsByStoreId, members };
}

export async function fetchOrgConfigBundleViaApi({
  organizationId,
  actorUserId,
  actorRole,
}) {
  const authKey = buildOrgConfigBundleAuthKey({ organizationId, actorUserId, actorRole });
  const inflight = orgConfigBundleInflight.get(authKey);
  if (inflight) return inflight;

  const promise = fetchOrgConfigBundleViaApiImpl({
    organizationId,
    actorUserId,
    actorRole,
  });
  orgConfigBundleInflight.set(authKey, promise);
  try {
    return await promise;
  } finally {
    orgConfigBundleInflight.delete(authKey);
  }
}
