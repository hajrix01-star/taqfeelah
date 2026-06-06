import {
  getCloseoutApiMaps,
  setRuntimeApiIdMaps as setCloseoutsRuntimeApiIdMaps,
} from "@/features/closeouts/client/closeouts-api-client.js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let cachedMaps = null;

export function setRuntimeApiIdMaps(overrides) {
  setCloseoutsRuntimeApiIdMaps(overrides);
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

function toHalalas(value) {
  return Math.round(Number(value || 0) * 100);
}

export async function fetchStoreEntriesViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  dateFrom = "",
  dateTo = "",
  status = "all",
  limit = 800,
}) {
  const { userIdMap, storeIdMap, salesChannelIdMap } = getMaps();
  const mappedOrganizationId = isUuid(organizationId) ? organizationId : "";
  const mappedActorUserId = mapToUuid(actorUserId, userIdMap);
  const mappedStoreId = mapToUuid(storeId, storeIdMap);

  if (!mappedOrganizationId || !mappedActorUserId || !mappedStoreId) {
    return null;
  }

  const search = new URLSearchParams();
  if (typeof dateFrom === "string" && dateFrom) search.set("dateFrom", dateFrom);
  if (typeof dateTo === "string" && dateTo) search.set("dateTo", dateTo);
  if (status === "active" || status === "voided" || status === "all") search.set("status", status);
  if (Number.isInteger(limit) && limit > 0) search.set("limit", String(limit));

  const response = await fetch(`/api/v1/stores/${mappedStoreId}/entries?${search.toString()}`, {
    method: "GET",
    headers: {
      "x-organization-id": mappedOrganizationId,
      "x-user-id": mappedActorUserId,
      "x-member-role": actorRole,
    },
  });

  if (!response.ok) {
    throw new Error(`entries fetch api failed: ${response.status}`);
  }

  const payload = await response.json();
  const items = Array.isArray(payload) ? payload : (Array.isArray(payload?.items) ? payload.items : []);
  if (!items.length && !Array.isArray(payload) && !Array.isArray(payload?.items)) return [];

  return items.map((item) => {
    if (!item || typeof item !== "object") return item;
    const mappedBusinessId = reverseLookupKeyByUuid(item.businessId, storeIdMap) || storeId;
    const mappedSalesChannels = Array.isArray(item.salesChannels)
      ? item.salesChannels.map((row) => ({
        ...row,
        channelId: reverseLookupKeyByUuid(row?.channelId, salesChannelIdMap) || row?.channelId,
      }))
      : [];
    return {
      ...item,
      businessId: mappedBusinessId,
      salesChannels: mappedSalesChannels,
    };
  });
}

export async function fetchStoreEntriesPageViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  dateFrom = "",
  dateTo = "",
  status = "all",
  limit = 50,
  cursor = "",
}) {
  const { userIdMap, storeIdMap, salesChannelIdMap } = getMaps();
  const mappedOrganizationId = isUuid(organizationId) ? organizationId : "";
  const mappedActorUserId = mapToUuid(actorUserId, userIdMap);
  const mappedStoreId = mapToUuid(storeId, storeIdMap);

  if (!mappedOrganizationId || !mappedActorUserId || !mappedStoreId) {
    return { items: [], nextCursor: null };
  }

  const search = new URLSearchParams({ paginated: "1" });
  if (typeof dateFrom === "string" && dateFrom) search.set("dateFrom", dateFrom);
  if (typeof dateTo === "string" && dateTo) search.set("dateTo", dateTo);
  if (status === "active" || status === "voided" || status === "all") search.set("status", status);
  if (Number.isInteger(limit) && limit > 0) search.set("limit", String(limit));
  if (typeof cursor === "string" && cursor) search.set("cursor", cursor);

  const response = await fetch(`/api/v1/stores/${mappedStoreId}/entries?${search.toString()}`, {
    method: "GET",
    headers: {
      "x-organization-id": mappedOrganizationId,
      "x-user-id": mappedActorUserId,
      "x-member-role": actorRole,
    },
  });

  if (!response.ok) {
    throw new Error(`entries page fetch api failed: ${response.status}`);
  }

  const payload = await response.json();
  const rawItems = Array.isArray(payload?.items) ? payload.items : [];
  const items = rawItems.map((item) => {
    if (!item || typeof item !== "object") return item;
    const mappedBusinessId = reverseLookupKeyByUuid(item.businessId, storeIdMap) || storeId;
    const mappedSalesChannels = Array.isArray(item.salesChannels)
      ? item.salesChannels.map((row) => ({
        ...row,
        channelId: reverseLookupKeyByUuid(row?.channelId, salesChannelIdMap) || row?.channelId,
      }))
      : [];
    return {
      ...item,
      businessId: mappedBusinessId,
      salesChannels: mappedSalesChannels,
    };
  });

  return {
    items,
    nextCursor: typeof payload?.nextCursor === "string" ? payload.nextCursor : null,
  };
}

export async function createStoreEntryViaApi({
  organizationId,
  actorUserId,
  actorRole,
  payload,
}) {
  const { userIdMap, storeIdMap, salesChannelIdMap } = getMaps();
  const mappedOrganizationId = isUuid(organizationId) ? organizationId : "";
  const mappedActorUserId = mapToUuid(actorUserId, userIdMap);
  const mappedStoreId = mapToUuid(payload?.businessId, storeIdMap);
  if (!mappedOrganizationId || !mappedActorUserId || !mappedStoreId) return null;

  const mappedSalesChannels = (payload?.salesChannels || [])
    .map((row) => ({
      salesChannelId: mapToUuid(row?.channelId || row?.id, salesChannelIdMap),
      channelName: row?.name || row?.channelName || row?.channelLabel || row?.channelId || row?.id,
      amountHalalas: toHalalas(row?.amount),
    }))
    .filter((row) => isUuid(row.salesChannelId) && row.amountHalalas > 0);

  const body = {
    date: payload?.date,
    type: payload?.type,
    amountHalalas: toHalalas(payload?.amount),
    categoryId: isUuid(payload?.categoryId) ? payload.categoryId : null,
    note: typeof payload?.note === "string" ? payload.note : "",
    salesChannels: mappedSalesChannels,
    attachment:
      payload?.attachment && typeof payload.attachment === "object"
        ? {
          kind: payload.attachment.kind || "image",
          name: payload.attachment.name || "attachment.jpg",
          mimeType: payload.attachment.mimeType || "image/jpeg",
          sizeBytes: Number(payload.attachment.sizeBytes || 0),
          ...(payload.attachment.storageKey
            ? { storageKey: payload.attachment.storageKey }
            : { dataUrl: payload.attachment.dataUrl || "" }),
        }
        : undefined,
  };

  const response = await fetch(`/api/v1/stores/${mappedStoreId}/entries`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-organization-id": mappedOrganizationId,
      "x-user-id": mappedActorUserId,
      "x-member-role": actorRole,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`entry create api failed: ${response.status}`);
  }
  return response.json();
}

export async function reviewStoreEntryViaApi({
  organizationId,
  actorUserId,
  actorRole,
  entry,
}) {
  const { userIdMap, storeIdMap } = getMaps();
  const mappedOrganizationId = isUuid(organizationId) ? organizationId : "";
  const mappedActorUserId = mapToUuid(actorUserId, userIdMap);
  const mappedStoreId = mapToUuid(entry?.businessId, storeIdMap);
  if (!mappedOrganizationId || !mappedActorUserId || !mappedStoreId || !isUuid(entry?.id)) return null;

  const response = await fetch(
    `/api/v1/stores/${mappedStoreId}/entries/${encodeURIComponent(entry.id)}/review`,
    {
      method: "POST",
      headers: {
        "x-organization-id": mappedOrganizationId,
        "x-user-id": mappedActorUserId,
        "x-member-role": actorRole,
      },
    },
  );
  if (!response.ok) {
    throw new Error(`entry review api failed: ${response.status}`);
  }
  return response.json();
}

export async function voidStoreEntryViaApi({
  organizationId,
  actorUserId,
  actorRole,
  entry,
  reason = "",
}) {
  const { userIdMap, storeIdMap } = getMaps();
  const mappedOrganizationId = isUuid(organizationId) ? organizationId : "";
  const mappedActorUserId = mapToUuid(actorUserId, userIdMap);
  const mappedStoreId = mapToUuid(entry?.businessId, storeIdMap);
  if (!mappedOrganizationId || !mappedActorUserId || !mappedStoreId || !isUuid(entry?.id)) return null;

  const response = await fetch(
    `/api/v1/stores/${mappedStoreId}/entries/${encodeURIComponent(entry.id)}/void`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-organization-id": mappedOrganizationId,
        "x-user-id": mappedActorUserId,
        "x-member-role": actorRole,
      },
      body: JSON.stringify({ reason }),
    },
  );
  if (!response.ok) {
    throw new Error(`entry void api failed: ${response.status}`);
  }
  return response.json();
}

export async function restoreStoreEntryViaApi({
  organizationId,
  actorUserId,
  actorRole,
  entry,
  reason = "",
}) {
  const { userIdMap, storeIdMap } = getMaps();
  const mappedOrganizationId = isUuid(organizationId) ? organizationId : "";
  const mappedActorUserId = mapToUuid(actorUserId, userIdMap);
  const mappedStoreId = mapToUuid(entry?.businessId, storeIdMap);
  if (!mappedOrganizationId || !mappedActorUserId || !mappedStoreId || !isUuid(entry?.id)) return null;

  const response = await fetch(
    `/api/v1/stores/${mappedStoreId}/entries/${encodeURIComponent(entry.id)}/restore`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-organization-id": mappedOrganizationId,
        "x-user-id": mappedActorUserId,
        "x-member-role": actorRole,
      },
      body: JSON.stringify({ reason }),
    },
  );
  if (!response.ok) {
    throw new Error(`entry restore api failed: ${response.status}`);
  }
  return response.json();
}
