const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function mapToUuid(value, map) {
  if (isUuid(value)) return value;
  if (typeof value !== "string" || !value.trim()) return "";
  const mapped = map[value] || map[value.trim()];
  return isUuid(mapped) ? mapped : "";
}

export function buildPrototypeApiAuthHeaders({
  organizationId = "",
  actorUserId = "",
  actorRole = "",
} = {}) {
  const userIdMap = parseJsonMap(process.env.NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP);
  const mappedOrganizationId = isUuid(organizationId) ? organizationId : "";
  const mappedActorUserId = mapToUuid(actorUserId, userIdMap);
  const headers = {};

  if (mappedOrganizationId) headers["x-organization-id"] = mappedOrganizationId;
  if (mappedActorUserId) headers["x-user-id"] = mappedActorUserId;
  if (typeof actorRole === "string" && actorRole.trim()) {
    headers["x-member-role"] = actorRole.trim();
  }

  return headers;
}
