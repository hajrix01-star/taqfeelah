import { isUuid, mapToUuid, reverseLookupKeyByUuid } from "@/core/client/api-id-utils";
import { fetchApiJsonWithPrototypeContext } from "@/core/client/api-fetch";
import { readPublicAppMode } from "@/core/config/app-mode";
import {
  getRuntimeApiMaps,
  setRuntimeApiIdMaps,
} from "@/core/client/runtime-api-maps-state";
import { resolvePrototypeApiContext } from "@/core/client/prototype-api-context";
import {
  asApiPayload,
  type ApiChannelRow,
  type ApiMemberRow,
  type ApiStoreRow,
  type OrgConfigApiAuth,
} from "./org-config-client-types";

export function setOrgConfigRuntimeApiIdMaps(overrides: Record<string, unknown>) {
  setRuntimeApiIdMaps(overrides);
}

function getMaps() {
  return getRuntimeApiMaps();
}

function assertProductionUuid(value: unknown, message: string) {
  if (readPublicAppMode() !== "production") return;
  if (!isUuid(value)) {
    throw new Error(message);
  }
}

function mapStoreIdsForWrite(storeIds: string[] = []) {
  if (readPublicAppMode() === "production") {
    storeIds.forEach((storeId) => assertProductionUuid(storeId, "production org-config writes require canonical store ids."));
    return storeIds;
  }
  const { storeIdMap } = getMaps();
  return storeIds
    .map((id) => mapToUuid(id, storeIdMap))
    .filter((value): value is string => isUuid(value));
}

export async function fetchOrganizationStoresViaApi({
  organizationId,
  actorUserId,
  actorRole,
  status = "active",
}: OrgConfigApiAuth & { status?: string }) {
  const { storeIdMap } = getMaps();
  const search = new URLSearchParams({ status });
  const payload = asApiPayload(await fetchApiJsonWithPrototypeContext(`/api/v1/stores?${search.toString()}`, {
    organizationId,
    actorUserId,
    actorRole,
    errorMessage: "stores list api failed",
    errorStyle: "status",
  }));
  const stores = Array.isArray(payload.stores) ? payload.stores as ApiStoreRow[] : [];
  return {
    stores: stores.map((store) => ({
      ...store,
      legacyId: reverseLookupKeyByUuid(String(store.id || ""), storeIdMap) || store.id,
    })),
  };
}

export async function fetchStoreSalesChannelsViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  status = "all",
}: OrgConfigApiAuth & { storeId: string; status?: string }) {
  const { storeIdMap, salesChannelIdMap } = getMaps();
  const mappedStoreId = mapToUuid(storeId, storeIdMap);
  if (!mappedStoreId) return { storeId, channels: [] as ApiChannelRow[] };

  const search = new URLSearchParams({ status });
  const payload = asApiPayload(await fetchApiJsonWithPrototypeContext(
    `/api/v1/stores/${mappedStoreId}/sales-channels?${search.toString()}`,
    {
      organizationId,
      actorUserId,
      actorRole,
      errorMessage: "sales channels api failed",
      errorStyle: "status",
    },
  ));
  const channels = Array.isArray(payload.channels) ? payload.channels as ApiChannelRow[] : [];
  return {
    storeId,
    channels: channels.map((channel) => ({
      ...channel,
      legacyId: reverseLookupKeyByUuid(String(channel.id || ""), salesChannelIdMap) || channel.id,
    })),
  };
}

export async function fetchOrganizationMembersViaApi({
  organizationId,
  actorUserId,
  actorRole,
  status = "all",
}: OrgConfigApiAuth & { status?: string }) {
  const { storeIdMap, userIdMap } = getMaps();
  const search = new URLSearchParams({ status });
  const payload = asApiPayload(await fetchApiJsonWithPrototypeContext(`/api/v1/members?${search.toString()}`, {
    organizationId,
    actorUserId,
    actorRole,
    errorMessage: "members list api failed",
    errorStyle: "status",
  }));
  const members = Array.isArray(payload.members) ? payload.members as ApiMemberRow[] : [];
  return {
    members: members.map((member) => ({
      ...member,
      legacyStaffId: reverseLookupKeyByUuid(String(member.userId || ""), userIdMap) || member.userId,
      storeAccess: (Array.isArray(member.storeAccess) ? member.storeAccess : []).map((row) => ({
        ...row,
        legacyStoreId: reverseLookupKeyByUuid(String(row.storeId || ""), storeIdMap) || row.storeId,
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
}: OrgConfigApiAuth & { name: string; location?: string }) {
  const payload = asApiPayload(await fetchApiJsonWithPrototypeContext("/api/v1/stores", {
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
  }));
  const store = (payload.store || payload) as ApiStoreRow;
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
}: OrgConfigApiAuth & {
  storeId: string;
  patch: Record<string, unknown>;
  reason?: string;
}) {
  assertProductionUuid(storeId, "production store operational settings update requires canonical store id.");
  const context = resolvePrototypeApiContext({ organizationId, actorUserId, actorRole, storeId });
  if (!context) throw new Error("store operational settings api failed: missing store mapping");

  const payload = asApiPayload(await fetchApiJsonWithPrototypeContext(
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
  ));
  return payload.operationalSettings || payload;
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
}: OrgConfigApiAuth & {
  storeId: string;
  name?: string;
  location?: string;
  status?: string;
  reason?: string;
}) {
  assertProductionUuid(storeId, "production store update requires canonical store id.");
  const { storeIdMap } = getMaps();
  const context = resolvePrototypeApiContext({ organizationId, actorUserId, actorRole, storeId });
  if (!context) throw new Error("store update api failed: missing store mapping");

  const body: Record<string, unknown> = {};
  if (typeof name === "string" && name.trim()) body.name = name.trim();
  if (location !== undefined) body.location = location;
  if (status === "active" || status === "archived") body.status = status;
  if (typeof reason === "string" && reason.trim()) body.reason = reason.trim();

  const payload = asApiPayload(await fetchApiJsonWithPrototypeContext(`/api/v1/stores/${context.storeId}`, {
    organizationId,
    actorUserId,
    actorRole,
    method: "PATCH",
    body,
    errorMessage: "store update api failed",
    errorStyle: "status",
  }));
  const store = (payload.store || payload) as ApiStoreRow;
  return {
    ...store,
    legacyId: reverseLookupKeyByUuid(String(store.id || ""), storeIdMap) || storeId,
  };
}

export async function createStoreSalesChannelViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  name,
  kind = "payment_method",
  status = "active",
  reason,
}: OrgConfigApiAuth & {
  storeId: string;
  name: string;
  kind?: string;
  status?: string;
  reason?: string;
}) {
  assertProductionUuid(storeId, "production sales channel create requires canonical store id.");
  const context = resolvePrototypeApiContext({ organizationId, actorUserId, actorRole, storeId });
  if (!context) throw new Error("sales channel create api failed: missing store mapping");
  if (!name?.trim()) throw new Error("sales channel create api failed: missing channel name");

  const payload = asApiPayload(await fetchApiJsonWithPrototypeContext(
    `/api/v1/stores/${context.storeId}/sales-channels`,
    {
      organizationId,
      actorUserId,
      actorRole,
      method: "POST",
      body: {
        name: name.trim(),
        kind,
        status,
        reason,
      },
      errorMessage: "sales channel create api failed",
      errorStyle: "status",
    },
  ));
  return payload.channel || payload;
}

export async function updateStoreSalesChannelViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  salesChannelId,
  status,
  reason,
}: OrgConfigApiAuth & {
  storeId: string;
  salesChannelId: string;
  status?: string;
  reason?: string;
}) {
  assertProductionUuid(storeId, "production sales channel update requires canonical store id.");
  const context = resolvePrototypeApiContext({ organizationId, actorUserId, actorRole, storeId });
  if (!context) throw new Error("sales channel update api failed: missing store mapping");
  if (!isUuid(salesChannelId)) throw new Error("sales channel update api failed: missing channel id");

  const payload = asApiPayload(await fetchApiJsonWithPrototypeContext(
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
  ));
  return payload.channel || payload;
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
}: OrgConfigApiAuth & {
  name: string;
  role?: string;
  storeIds?: string[];
  pin?: string;
  loginPhone?: string;
}) {
  const mappedStoreIds = mapStoreIdsForWrite(storeIds);

  const body: Record<string, unknown> = {
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

  const payload = asApiPayload(await fetchApiJsonWithPrototypeContext("/api/v1/members", {
    organizationId,
    actorUserId,
    actorRole,
    method: "POST",
    body,
    errorMessage: "member create api failed",
    errorStyle: "status",
  }));
  return payload.member || payload;
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
}: OrgConfigApiAuth & {
  memberId: string;
  name?: string;
  status?: string;
  storeIds?: string[];
  pin?: string;
  loginPhone?: string;
  reason?: string;
}) {
  if (!isUuid(memberId)) throw new Error("member update api failed: missing member id");

  const body: Record<string, unknown> = {};
  if (typeof name === "string" && name.trim()) body.name = name.trim();
  if (status === "active" || status === "inactive") body.status = status;
  if (Array.isArray(storeIds)) {
    body.storeIds = mapStoreIdsForWrite(storeIds);
  }
  if (typeof pin === "string" && pin.trim()) {
    body.credentials = { type: "employee_pin", pin: pin.trim() };
  }
  if (typeof loginPhone === "string" && loginPhone.trim()) {
    body.loginPhone = loginPhone.trim();
  }
  if (typeof reason === "string" && reason.trim()) body.reason = reason.trim();

  const payload = asApiPayload(await fetchApiJsonWithPrototypeContext(`/api/v1/members/${memberId}`, {
    organizationId,
    actorUserId,
    actorRole,
    method: "PATCH",
    body,
    errorMessage: "member update api failed",
    errorStyle: "status",
  }));
  return payload.member || payload;
}

async function fetchStoresAndChannelsBundleViaApi({
  organizationId,
  actorUserId,
  actorRole,
}: OrgConfigApiAuth) {
  const { storeIdMap, salesChannelIdMap } = getMaps();
  const search = new URLSearchParams({
    storeStatus: "all",
    channelStatus: "all",
  });

  try {
    const payload = asApiPayload(await fetchApiJsonWithPrototypeContext(
      `/api/v1/org-config/stores-channels-bundle?${search.toString()}`,
      {
        organizationId,
        actorUserId,
        actorRole,
        errorMessage: "stores/channels bundle api failed",
        errorStyle: "status",
      },
    ));

    const stores = Array.isArray(payload.stores) ? payload.stores as ApiStoreRow[] : [];
    const channelsByStoreIdRaw = payload.channelsByStoreId && typeof payload.channelsByStoreId === "object"
      ? payload.channelsByStoreId as Record<string, ApiChannelRow[]>
      : {};

    const mappedStores = stores.map((store) => ({
      ...store,
      legacyId: reverseLookupKeyByUuid(String(store.id || ""), storeIdMap) || store.id,
    }));

    const channelsByStoreId: Record<string, ApiChannelRow[]> = {};
    mappedStores.forEach((store) => {
      const rawChannels = Array.isArray(channelsByStoreIdRaw[String(store.id || "")])
        ? channelsByStoreIdRaw[String(store.id || "")]
        : [];
      channelsByStoreId[String(store.id || "")] = rawChannels.map((channel) => ({
        ...channel,
        legacyId: reverseLookupKeyByUuid(String(channel.id || ""), salesChannelIdMap) || channel.id,
      }));
    });

    return { stores: mappedStores, channelsByStoreId };
  } catch (error) {
    console.warn("stores/channels bundle API unavailable, falling back to per-store channel fetch", error);
  }

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
      storeId: String(store.legacyId || store.id || ""),
      status: "all",
    })),
  );

  const channelsByStoreId: Record<string, ApiChannelRow[]> = {};
  channelResults.forEach((result, index) => {
    const storeUuid = stores[index]?.id || result.storeId;
    channelsByStoreId[String(storeUuid || "")] = result.channels || [];
  });

  return { stores, channelsByStoreId };
}

/** Stores + channels only — safe for employee role (no members list). */
export async function fetchEmployeeRuntimeBundleViaApi(auth: OrgConfigApiAuth) {
  return fetchStoresAndChannelsBundleViaApi(auth);
}

const orgConfigBundleInflight = new Map<string, Promise<{
  stores: ApiStoreRow[];
  channelsByStoreId: Record<string, ApiChannelRow[]>;
  members: ApiMemberRow[];
}>>();

function buildOrgConfigBundleAuthKey({
  organizationId = "",
  actorUserId = "",
  actorRole = "",
}: Partial<OrgConfigApiAuth> = {}) {
  return `${organizationId}|${actorUserId}|${actorRole}`;
}

async function fetchOrgConfigBundleViaApiImpl({
  organizationId,
  actorUserId,
  actorRole,
}: OrgConfigApiAuth) {
  const { stores, channelsByStoreId } = await fetchStoresAndChannelsBundleViaApi({
    organizationId,
    actorUserId,
    actorRole,
  });

  let members: ApiMemberRow[] = [];
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
}: OrgConfigApiAuth) {
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
