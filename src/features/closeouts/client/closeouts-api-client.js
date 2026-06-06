import { buildSalesChannelIdMap } from "@/core/client/sales-channel-catalog";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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

export function getCloseoutApiMaps() {
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

function getMaps() {
  return getCloseoutApiMaps();
}

function mapToUuid(value, map) {
  if (isUuid(value)) return value;
  if (typeof value !== "string" || !value.trim()) return "";
  const mapped = map[value] || map[value.trim()];
  return isUuid(mapped) ? mapped : "";
}

/** True when legacy or UUID actor id can be sent to closeouts API. */
export function hasCloseoutApiActorMapping(actorUserId) {
  const { userIdMap } = getMaps();
  return Boolean(mapToUuid(actorUserId, userIdMap));
}

/** True when legacy or UUID store id can be sent to closeouts API. */
export function hasCloseoutApiStoreMapping(storeId) {
  const { storeIdMap } = getMaps();
  return Boolean(mapToUuid(storeId, storeIdMap));
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

function listCloseoutSalesRows(closeout) {
  return Array.isArray(closeout?.sales) ? closeout.sales : Object.values(closeout?.sales || {});
}

function extractSalesChannels(closeout) {
  const { salesChannelIdMap } = getMaps();
  return listCloseoutSalesRows(closeout)
    .map((row) => ({
      salesChannelId: mapToUuid(row?.channelId || row?.id, salesChannelIdMap),
      channelName: row?.name || row?.channelName || row?.channelLabel || row?.channelId || row?.id,
      amountHalalas: toHalalas(row?.amount),
      legacyChannelId: row?.channelId || row?.id || "",
    }))
    .filter((row) => isUuid(row.salesChannelId) && row.amountHalalas > 0);
}

/** Explain why submitCloseoutViaApi would return null (mapping / channel gaps). */
export function diagnoseCloseoutSubmitFailure({
  organizationId,
  actorUserId,
  closeout,
}) {
  const mappedOrganizationId = isUuid(organizationId) ? organizationId : "";
  if (!mappedOrganizationId) return { code: "invalid_organization", unmappedChannels: [] };

  const { userIdMap, storeIdMap, salesChannelIdMap } = getMaps();
  const mappedActorUserId = mapToUuid(actorUserId, userIdMap);
  if (!mappedActorUserId) return { code: "unmapped_actor", unmappedChannels: [] };

  const mappedStoreId = mapToUuid(closeout?.storeId, storeIdMap);
  if (!mappedStoreId) return { code: "unmapped_store", unmappedChannels: [] };

  const unmappedChannels = listCloseoutSalesRows(closeout)
    .filter((row) => toHalalas(row?.amount) > 0)
    .map((row) => ({
      channelId: row?.channelId || row?.id || "",
      name: row?.name || row?.channelName || "",
      amount: Number(row?.amount || 0),
      mapped: isUuid(mapToUuid(row?.channelId || row?.id, salesChannelIdMap)),
    }))
    .filter((row) => !row.mapped);

  if (unmappedChannels.length > 0) {
    return { code: "unmapped_sales_channels", unmappedChannels };
  }

  const salesChannels = extractSalesChannels(closeout);
  if (!salesChannels.length) return { code: "empty_sales", unmappedChannels: [] };

  return null;
}

function extractOutflows(closeout) {
  return (closeout?.outflows || [])
    .map((row) => ({
      type: row?.type,
      amountHalalas: toHalalas(row?.amount),
      categoryId: isUuid(row?.categoryId) ? row.categoryId : null,
      categoryName: typeof row?.category === "string"
        ? row.category
        : (typeof row?.categoryName === "string" ? row.categoryName : ""),
      typeLabel: typeof row?.typeLabel === "string" ? row.typeLabel : "",
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
  requireReview = false,
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
      requireReview: requireReview === true,
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
  if (!Array.isArray(payload)) return [];
  return payload.map((item) => {
    if (!item || typeof item !== "object") return item;
    const mappedStoreId = reverseLookupKeyByUuid(item.storeId, storeIdMap) || storeId;
    const salesRows = Array.isArray(item.sales)
      ? item.sales.map((row) => ({
        ...row,
        channelId: reverseLookupKeyByUuid(row?.channelId, salesChannelIdMap) || row?.channelId,
      }))
      : item.sales;
    const mappedOpenedByUserId = reverseLookupKeyByUuid(item.openedByUserId, userIdMap) || item.openedByUserId;
    const mappedSubmittedByUserId = reverseLookupKeyByUuid(item.submittedByUserId, userIdMap) || item.submittedByUserId;
    return {
      ...item,
      storeId: mappedStoreId,
      openedByUserId: mappedOpenedByUserId,
      submittedByUserId: mappedSubmittedByUserId,
      sales: salesRows,
    };
  });
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
