import { isUuid } from "@/core/client/api-id-utils";

export function readBuildTimeOrganizationId() {
  return process.env.NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID || "";
}

/**
 * Prefer authenticated session org id; fall back to build-time public env.
 */
export function resolveClientOrganizationId({
  sessionOrganizationId = "",
  envOrganizationId = readBuildTimeOrganizationId(),
} = {}) {
  if (isUuid(sessionOrganizationId)) return sessionOrganizationId;
  if (isUuid(envOrganizationId)) return envOrganizationId;
  return "";
}
