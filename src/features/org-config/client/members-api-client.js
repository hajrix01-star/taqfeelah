import {
  getCloseoutApiMaps,
  setRuntimeApiIdMaps,
} from "@/features/closeouts/client/closeouts-api-client.js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let cachedMaps = null;

export function setMembersRuntimeApiIdMaps(overrides) {
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

function authHeaders({ organizationId, actorUserId, actorRole }) {
  const { userIdMap } = getMaps();
  return {
    "content-type": "application/json",
    "x-organization-id": isUuid(organizationId) ? organizationId : "",
    "x-user-id": mapToUuid(actorUserId, userIdMap),
    "x-member-role": actorRole,
  };
}

export async function createOrganizationMemberViaApi({
  organizationId,
  actorUserId,
  actorRole,
  payload,
}) {
  const { storeIdMap } = getMaps();
  const storeIds = (payload?.storeIds || [])
    .map((storeId) => mapToUuid(storeId, storeIdMap))
    .filter((storeId) => isUuid(storeId));

  const response = await fetch("/api/v1/members", {
    method: "POST",
    headers: authHeaders({ organizationId, actorUserId, actorRole }),
    body: JSON.stringify({
      name: payload?.name,
      role: payload?.role,
      storeIds,
      credentials: payload?.credentials,
    }),
  });

  if (!response.ok) {
    throw new Error(`member create api failed: ${response.status}`);
  }
  return response.json();
}

export async function updateOrganizationMemberViaApi({
  organizationId,
  actorUserId,
  actorRole,
  memberId,
  payload,
}) {
  const { storeIdMap } = getMaps();
  const storeIds = Array.isArray(payload?.storeIds)
    ? payload.storeIds.map((storeId) => mapToUuid(storeId, storeIdMap)).filter((storeId) => isUuid(storeId))
    : undefined;

  const response = await fetch(`/api/v1/members/${encodeURIComponent(memberId)}`, {
    method: "PATCH",
    headers: authHeaders({ organizationId, actorUserId, actorRole }),
    body: JSON.stringify({
      name: payload?.name,
      role: payload?.role,
      status: payload?.status,
      storeIds,
      credentials: payload?.credentials,
      reason: payload?.reason,
    }),
  });

  if (!response.ok) {
    throw new Error(`member update api failed: ${response.status}`);
  }
  return response.json();
}
