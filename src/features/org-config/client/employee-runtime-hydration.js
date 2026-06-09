import { fetchOrgConfigBundleViaApi } from "./org-config-api-client.js";
import { mapOrgConfigBundleToRuntime } from "./org-config-runtime-mapper.js";

export function readEmployeeRuntimeApiAuth(sessionUserId = "") {
  return {
    organizationId: process.env.NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID || "",
    actorUserId: sessionUserId,
    actorRole: "employee",
  };
}

/**
 * Load stores/channels/staff from the server for employee sessions that do not run owner org-config hydration.
 */
export async function loadEmployeeRuntimeContextFromApi({
  sessionUserId,
  employeePins = {},
}) {
  if (!sessionUserId) return null;
  const auth = readEmployeeRuntimeApiAuth(sessionUserId);
  const bundle = await fetchOrgConfigBundleViaApi(auth);
  return mapOrgConfigBundleToRuntime({
    ...bundle,
    employeePins,
  });
}
