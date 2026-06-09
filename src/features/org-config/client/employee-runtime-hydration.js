import { resolveClientOrganizationId } from "@/core/client/resolve-client-organization-id";
import { fetchEmployeeRuntimeBundleViaApi } from "./org-config-api-client.js";
import { mapEmployeeStoresBundleToRuntime } from "./org-config-runtime-mapper.js";

export function readEmployeeRuntimeApiAuth(sessionUserId = "", sessionOrganizationId = "") {
  return {
    organizationId: resolveClientOrganizationId({ sessionOrganizationId }),
    actorUserId: sessionUserId,
    actorRole: "employee",
  };
}

/**
 * Load stores/channels/operational settings for employee sessions.
 * Does not call the members API (manager-only) and does not replace roster staff.
 */
export async function loadEmployeeRuntimeContextFromApi({
  sessionUserId,
  sessionOrganizationId = "",
}) {
  if (!sessionUserId) return null;
  const auth = readEmployeeRuntimeApiAuth(sessionUserId, sessionOrganizationId);
  const bundle = await fetchEmployeeRuntimeBundleViaApi(auth);
  return mapEmployeeStoresBundleToRuntime(bundle);
}
