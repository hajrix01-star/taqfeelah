import { fetchApiJsonWithPrototypeContext } from "@/core/client/api-fetch";
import type { OwnerAccountSummary } from "@/features/owner-account/types";

export async function fetchOwnerAccountSummaryViaApi({
  organizationId,
  actorUserId,
  actorRole,
}: {
  organizationId: string;
  actorUserId: string;
  actorRole: string;
}) {
  return fetchApiJsonWithPrototypeContext("/api/v1/owner/account", {
    organizationId,
    actorUserId,
    actorRole,
    errorMessage: "Failed to load owner account details.",
  }) as Promise<OwnerAccountSummary>;
}
