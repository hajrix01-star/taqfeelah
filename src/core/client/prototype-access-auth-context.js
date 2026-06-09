import { isUuid, parseJsonMap } from "@/core/client/api-id-utils";

/** Env-backed auth context for local DB dev when prototype access skips real login. */
export function readPrototypeAccessAuthContext() {
  const organizationId = process.env.NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID || "";
  const ownerUserId = process.env.NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID || "";
  const userIdMap = parseJsonMap(process.env.NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP);
  const defaultEmployeeLegacyId = userIdMap.ahmed ? "ahmed" : Object.keys(userIdMap).find((key) => key !== "owner") || "";
  const defaultEmployeeUserId = defaultEmployeeLegacyId
    ? (userIdMap[defaultEmployeeLegacyId] || "")
    : "";

  return {
    organizationId: isUuid(organizationId) ? organizationId : "",
    ownerUserId: isUuid(ownerUserId) ? ownerUserId : "",
    defaultEmployeeLegacyId,
    defaultEmployeeUserId: isUuid(defaultEmployeeUserId) ? defaultEmployeeUserId : "",
  };
}
