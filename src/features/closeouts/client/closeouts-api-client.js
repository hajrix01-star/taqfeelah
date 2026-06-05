const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let cachedMaps = null;

export function isUuid(value) {
  return typeof value === "string" && uuidPattern.test(value);
}

function parseJsonMap(rawValue) {
  if (!rawValue || typeof rawValue !== "string") return {};
  try {
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function getMaps() {
  if (cachedMaps) return cachedMaps;
  cachedMaps = {
    storeIdMap: parseJsonMap(process.env.NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP),
    userIdMap: parseJsonMap(process.env.NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP),
    salesChannelIdMap: parseJsonMap(process.env.NEXT_PUBLIC_CLOSEOUTS_SALES_CHANNEL_ID_MAP),
  };
  return cachedMaps;
}

function mapToUuid(value, map) {
  if (isUuid(value)) return value;
  if (typeof value !== "string" || !value.trim()) return "";
  const mapped = map[value] || map[value.trim()];
  return isUuid(mapped) ? mapped : "";
}

function toHalalas(value) {
  return Math.round(Number(value || 0) * 100);
}

function extractSalesChannels(closeout) {
  const { salesChannelIdMap } = getMaps();
  const rows = Array.isArray(closeout?.sales) ? closeout.sales : Object.values(closeout?.sales || {});
  return rows
    .map((row) => ({
      salesChannelId: mapToUuid(row?.channelId || row?.id, salesChannelIdMap),
      channelName: row?.name || row?.channelName || row?.channelLabel || row?.channelId || row?.id,
      amountHalalas: toHalalas(row?.amount),
    }))
    .filter((row) => isUuid(row.salesChannelId) && row.amountHalalas > 0);
}

function extractOutflows(closeout) {
  return (closeout?.outflows || [])
    .map((row) => ({
      type: row?.type,
      amountHalalas: toHalalas(row?.amount),
      categoryId: isUuid(row?.categoryId) ? row.categoryId : null,
      note: typeof row?.note === "string" ? row.note : "",
    }))
    .filter((row) => (row.type === "purchases" || row.type === "expense" || row.type === "withdrawal") && row.amountHalalas > 0);
}

export async function submitCloseoutViaApi({
  organizationId,
  actorUserId,
  actorRole,
  closeout,
  mode = "submit",
  autoReview = false,
}) {
  const { userIdMap, storeIdMap } = getMaps();
  const mappedOrganizationId = isUuid(organizationId) ? organizationId : "";
  const mappedActorUserId = mapToUuid(actorUserId, userIdMap);
  const mappedStoreId = mapToUuid(closeout?.storeId, storeIdMap);

  if (!mappedOrganizationId || !mappedActorUserId || !mappedStoreId) {
    return null;
  }

  const salesChannels = extractSalesChannels(closeout);
  if (!salesChannels.length) return null;

  const response = await fetch(`/api/v1/stores/${mappedStoreId}/closeouts`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-organization-id": mappedOrganizationId,
      "x-user-id": mappedActorUserId,
      "x-member-role": actorRole,
    },
    body: JSON.stringify({
      mode,
      autoReview: autoReview === true,
      closeoutId: closeout.id,
      date: closeout.date,
      salesChannels,
      outflows: extractOutflows(closeout),
      note: closeout?.note || "",
    }),
  });

  if (!response.ok) {
    throw new Error(`closeout submit api failed: ${response.status}`);
  }
  return response.json();
}

export async function fetchStoreCloseoutsViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  dateFrom = "",
  dateTo = "",
}) {
  const { userIdMap, storeIdMap } = getMaps();
  const mappedOrganizationId = isUuid(organizationId) ? organizationId : "";
  const mappedActorUserId = mapToUuid(actorUserId, userIdMap);
  const mappedStoreId = mapToUuid(storeId, storeIdMap);

  if (!mappedOrganizationId || !mappedActorUserId || !mappedStoreId) {
    return null;
  }

  const search = new URLSearchParams();
  if (typeof dateFrom === "string" && dateFrom) search.set("dateFrom", dateFrom);
  if (typeof dateTo === "string" && dateTo) search.set("dateTo", dateTo);
  const query = search.toString();

  const response = await fetch(`/api/v1/stores/${mappedStoreId}/closeouts${query ? `?${query}` : ""}`, {
    method: "GET",
    headers: {
      "x-organization-id": mappedOrganizationId,
      "x-user-id": mappedActorUserId,
      "x-member-role": actorRole,
    },
  });

  if (!response.ok) {
    throw new Error(`closeout fetch api failed: ${response.status}`);
  }
  const payload = await response.json();
  return Array.isArray(payload) ? payload : [];
}

export async function reviewCloseoutViaApi({
  organizationId,
  actorUserId,
  actorRole,
  closeout,
  action,
  reason = "",
}) {
  const { userIdMap, storeIdMap } = getMaps();
  const mappedOrganizationId = isUuid(organizationId) ? organizationId : "";
  const mappedActorUserId = mapToUuid(actorUserId, userIdMap);
  const mappedStoreId = mapToUuid(closeout?.storeId, storeIdMap);

  if (!mappedOrganizationId || !mappedActorUserId || !mappedStoreId || !closeout?.id) {
    return null;
  }

  const response = await fetch(`/api/v1/stores/${mappedStoreId}/closeouts/${encodeURIComponent(closeout.id)}/review`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-organization-id": mappedOrganizationId,
      "x-user-id": mappedActorUserId,
      "x-member-role": actorRole,
    },
    body: JSON.stringify({
      action,
      date: closeout.date,
      reason,
    }),
  });

  if (!response.ok) {
    throw new Error(`closeout review api failed: ${response.status}`);
  }
  return response.json();
}
