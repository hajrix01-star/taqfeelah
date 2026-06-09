import { fetchEmployeeRuntimeBundleViaApi } from "./org-config-api-client.js";
import { mapEmployeeStoresBundleToRuntime } from "./org-config-runtime-mapper.js";

export function readEmployeeRuntimeApiAuth(sessionUserId = "") {
  return {
    organizationId: process.env.NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID || "",
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
}) {
  if (!sessionUserId) return null;
  const auth = readEmployeeRuntimeApiAuth(sessionUserId);
  const bundle = await fetchEmployeeRuntimeBundleViaApi(auth);
  return mapEmployeeStoresBundleToRuntime(bundle);
}
