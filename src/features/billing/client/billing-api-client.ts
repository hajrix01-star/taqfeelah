import { fetchApiJsonWithRuntimeContext } from "@/core/client/api-fetch";
import type { ResolvedOrganizationEntitlements } from "@/features/billing/types";

export async function fetchOrganizationEntitlementsViaApi({
  organizationId,
  actorUserId,
  actorRole,
}: {
  organizationId: string;
  actorUserId: string;
  actorRole: string;
}) {
  return fetchApiJsonWithRuntimeContext("/api/v1/billing/entitlements", {
    organizationId,
    actorUserId,
    actorRole,
    errorMessage: "Failed to load subscription entitlements.",
  }) as Promise<ResolvedOrganizationEntitlements>;
}
