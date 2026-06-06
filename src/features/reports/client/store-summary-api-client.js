import {
  getCloseoutApiMaps,
  setRuntimeApiIdMaps,
} from "@/features/closeouts/client/closeouts-api-client.js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let cachedMaps = null;

export function setSummaryRuntimeApiIdMaps(overrides) {
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

export async function fetchStoreDaySummaryViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  date,
}) {
  const { userIdMap, storeIdMap } = getMaps();
  const mappedOrganizationId = isUuid(organizationId) ? organizationId : "";
  const mappedActorUserId = mapToUuid(actorUserId, userIdMap);
  const mappedStoreId = mapToUuid(storeId, storeIdMap);

  if (!mappedOrganizationId || !mappedActorUserId || !mappedStoreId || !date) {
    return null;
  }

  const search = new URLSearchParams({ date });
  const response = await fetch(`/api/v1/stores/${mappedStoreId}/summary/day?${search.toString()}`, {
    method: "GET",
    headers: {
      "x-organization-id": mappedOrganizationId,
      "x-user-id": mappedActorUserId,
      "x-member-role": actorRole,
    },
  });

  if (!response.ok) {
    throw new Error(`day summary api failed: ${response.status}`);
  }

  return response.json();
}

export async function fetchStoreMonthSummaryViaApi({
  organizationId,
  actorUserId,
  actorRole,
  storeId,
  month,
}) {
  const { userIdMap, storeIdMap } = getMaps();
  const mappedOrganizationId = isUuid(organizationId) ? organizationId : "";
  const mappedActorUserId = mapToUuid(actorUserId, userIdMap);
  const mappedStoreId = mapToUuid(storeId, storeIdMap);

  if (!mappedOrganizationId || !mappedActorUserId || !mappedStoreId || !month) {
    return null;
  }

  const search = new URLSearchParams({ month });
  const response = await fetch(`/api/v1/stores/${mappedStoreId}/summary/month?${search.toString()}`, {
    method: "GET",
    headers: {
      "x-organization-id": mappedOrganizationId,
      "x-user-id": mappedActorUserId,
      "x-member-role": actorRole,
    },
  });

  if (!response.ok) {
    throw new Error(`month summary api failed: ${response.status}`);
  }

  return response.json();
}
