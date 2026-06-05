const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let cachedMaps = null;

function isUuid(value) {
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

function reverseLookupKeyByUuid(uuidValue, map) {
  if (!isUuid(uuidValue) || !map || typeof map !== "object") return "";
  for (const [key, value] of Object.entries(map)) {
    if (isUuid(value) && value.toLowerCase() === uuidValue.toLowerCase()) return key;
  }
  return "";
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
  if (!Array.isArray(payload)) return [];

  return payload.map((item) => {
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
