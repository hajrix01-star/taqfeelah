import { assertOrganizationAccess } from "@/core/auth/assert-organization-access";
import { fail } from "@/core/http/api-response";
import { withAuthedApiRouteNoParams } from "@/core/http/api-route-handler";
import { resolveOwnerAccountSummary } from "@/features/owner-account/server/resolve-owner-account-summary";

export const dynamic = "force-dynamic";

export const GET = withAuthedApiRouteNoParams(async ({ auth }) => {
  await assertOrganizationAccess({
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    minimumRole: "owner",
  });

  const summary = await resolveOwnerAccountSummary({
    organizationId: auth.organizationId,
    ownerUserId: auth.userId,
  });

  if (!summary) {
    return fail(new Error("Owner account was not found."));
  }

  return summary;
});
