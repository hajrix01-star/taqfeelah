import { fail, ok } from "@/core/http/api-response";
import { assertOrganizationAccess } from "@/core/auth/assert-organization-access";
import { resolveRequestContext } from "@/core/auth/request-context";
import { resolveOwnerAccountSummary } from "@/features/owner-account/server/resolve-owner-account-summary";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const context = resolveRequestContext(request, { requireUser: true });
    if (!context.userId) {
      throw new Error("Authenticated user is required.");
    }

    await assertOrganizationAccess({
      organizationId: context.organizationId,
      actorUserId: context.userId,
      actorRole: context.role ?? "owner",
      minimumRole: "owner",
    });

    const summary = await resolveOwnerAccountSummary({
      organizationId: context.organizationId,
      ownerUserId: context.userId,
    });

    if (!summary) {
      return fail(new Error("Owner account was not found."));
    }

    return ok(summary);
  } catch (error) {
    return fail(error);
  }
}
