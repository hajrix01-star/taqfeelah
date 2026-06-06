import {
  getCloseoutApiMaps,
  setRuntimeApiIdMaps,
} from "@/features/closeouts/client/closeouts-api-client.js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let cachedMaps = null;

export function setPhase9RuntimeApiIdMaps(overrides) {
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

function toHalalas(value) {
  return Math.round(Number(value || 0) * 100);
}

function authHeaders({ organizationId, actorUserId, actorRole }) {
  const { userIdMap } = getMaps();
  const mappedOrganizationId = isUuid(organizationId) ? organizationId : "";
  const mappedActorUserId = mapToUuid(actorUserId, userIdMap);
  return {
    "content-type": "application/json",
    "x-organization-id": mappedOrganizationId,
    "x-user-id": mappedActorUserId,
    "x-member-role": actorRole,
  };
}

function mapSummaryPayloadToApiBody(payload) {
  const { salesChannelIdMap } = getMaps();
  const salesChannels = (payload?.salesChannels || [])
    .map((row) => ({
      salesChannelId: mapToUuid(row?.channelId || row?.id, salesChannelIdMap),
      channelName: row?.name || row?.channelName || row?.channelLabel || row?.channelId || row?.id,
      amountHalalas: toHalalas(row?.amount),
    }))
    .filter((row) => isUuid(row.salesChannelId) && row.amountHalalas > 0);

  const attachment = payload?.attachment && typeof payload.attachment === "object"
    ? {
      kind: "image",
      name: payload.attachment.name || "attachment.jpg",
      mimeType: payload.attachment.mimeType || "image/jpeg",
      sizeBytes: Number(payload.attachment.sizeBytes || 0),
      ...(payload.attachment.storageKey
        ? { storageKey: payload.attachment.storageKey }
        : { dataUrl: payload.attachment.dataUrl || "" }),
    }
    : undefined;

  return {
    type: "summary",
    note: typeof payload?.note === "string" ? payload.note : "",
    salesChannels,
    attachment,
  };
}

export async function approveDuplicateSummaryViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  date,
  payload,
}) {
  const { storeIdMap } = getMaps();
  const mappedStoreId = mapToUuid(storeId, storeIdMap);
  if (!mappedStoreId || !isUuid(organizationId) || !date) return null;

  const response = await fetch(
    `/api/v1/stores/${mappedStoreId}/entries/duplicate-summary/approve`,
    {
      method: "POST",
      headers: authHeaders({ organizationId, actorUserId, actorRole }),
      body: JSON.stringify({
        date,
        payload: mapSummaryPayloadToApiBody(payload),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`duplicate summary approve api failed: ${response.status}`);
  }
  return response.json();
}

export async function acknowledgeDuplicateSummariesViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  date,
  entryIds,
}) {
  const { storeIdMap } = getMaps();
  const mappedStoreId = mapToUuid(storeId, storeIdMap);
  const mappedEntryIds = (Array.isArray(entryIds) ? entryIds : []).filter((value) => isUuid(value));
  if (!mappedStoreId || !isUuid(organizationId) || !date || !mappedEntryIds.length) return null;

  const response = await fetch(
    `/api/v1/stores/${mappedStoreId}/entries/duplicate-summary/acknowledge`,
    {
      method: "POST",
      headers: authHeaders({ organizationId, actorUserId, actorRole }),
      body: JSON.stringify({
        date,
        entryIds: mappedEntryIds,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`duplicate summary acknowledge api failed: ${response.status}`);
  }
  return response.json();
}

export async function fetchNotebookExportViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  period = "day",
  from = "",
  to = "",
  date = "",
  month = "",
}) {
  const { storeIdMap } = getMaps();
  const mappedStoreId = mapToUuid(storeId, storeIdMap);
  if (!mappedStoreId || !isUuid(organizationId)) return null;

  const search = new URLSearchParams({
    storeId: mappedStoreId,
    period,
  });
  if (from) search.set("from", from);
  if (to) search.set("to", to);
  if (date) search.set("date", date);
  if (month) search.set("month", month);

  const response = await fetch(`/api/v1/exports/notebook?${search.toString()}`, {
    method: "GET",
    headers: authHeaders({ organizationId, actorUserId, actorRole }),
  });

  if (!response.ok) {
    throw new Error(`notebook export api failed: ${response.status}`);
  }

  const payload = await response.json();
  return {
    ...payload,
    storeId: reverseLookupKeyByUuid(payload?.storeId, storeIdMap) || storeId,
  };
}

export async function registerInlineAttachmentViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  attachment,
}) {
  const { storeIdMap } = getMaps();
  const mappedStoreId = mapToUuid(storeId, storeIdMap);
  if (!mappedStoreId || !isUuid(organizationId) || !attachment) return null;

  const response = await fetch(`/api/v1/stores/${mappedStoreId}/attachments/inline`, {
    method: "POST",
    headers: authHeaders({ organizationId, actorUserId, actorRole }),
    body: JSON.stringify({ attachment }),
  });

  if (!response.ok) {
    throw new Error(`inline attachment api failed: ${response.status}`);
  }
  return response.json();
}
