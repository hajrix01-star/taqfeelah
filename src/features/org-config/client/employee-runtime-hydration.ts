import { resolveClientOrganizationId } from "@/core/client/resolve-client-organization-id";
import { bindsToServerAuth } from "@/core/config/runtime-capabilities";
import { fetchEmployeeRuntimeBundleViaApi } from "./org-config-api-client";
import {
  mapEmployeeStoresBundleToRuntime,
  validateOrgConfigDbChannelMappings,
} from "./org-config-runtime-mapper";

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
}: {
  sessionUserId: string;
  sessionOrganizationId?: string;
}) {
  if (!sessionUserId) return null;
  const auth = readEmployeeRuntimeApiAuth(sessionUserId, sessionOrganizationId);
  const bundle = await fetchEmployeeRuntimeBundleViaApi(auth);
  const mapped = mapEmployeeStoresBundleToRuntime(bundle);
  validateOrgConfigDbChannelMappings(mapped, { strict: bindsToServerAuth() });
  return mapped;
}
