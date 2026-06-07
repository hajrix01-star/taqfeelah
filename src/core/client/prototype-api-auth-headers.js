import { isUuid, mapToUuid } from "@/core/client/api-id-utils";
import { getRuntimeApiMaps } from "@/core/client/runtime-api-maps-state";

export function buildPrototypeApiAuthHeaders({
  organizationId = "",
  actorUserId = "",
  actorRole = "",
} = {}) {
  const { userIdMap } = getRuntimeApiMaps();
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
