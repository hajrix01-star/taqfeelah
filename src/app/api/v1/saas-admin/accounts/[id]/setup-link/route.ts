import { fail, ok } from "@/core/http/api-response";
import { resolveAppPublicOrigin } from "@/core/auth/app-origin";
import { ValidationError } from "@/core/errors/app-error";
import { createAccountSetupToken } from "@/features/account-setup/server/create-account-setup-token";
import { resolveOrganizationOwnerMember } from "@/features/saas-admin/server/resolve-organization-owner-member";
import { assertSaasAdminRouteReady } from "@/features/saas-admin/server/saas-admin-route-guard";
import { getDb } from "@/core/db/client";
import { authIdentities } from "@/core/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { actorUserId } = await assertSaasAdminRouteReady(request);
    const { id: organizationId } = await context.params;
    const body = await request.json();
    const purpose = body?.purpose === "onboarding" ? "onboarding" : "password_reset";

    const ownerMember = await resolveOrganizationOwnerMember(organizationId, getDb());
    if (!ownerMember?.userId) {
      throw new ValidationError("Owner member was not found for this organization.");
    }

    const db = getDb();
    const [identity] = await db
      .select({
        loginPhone: authIdentities.loginPhone,
        phoneNumber: authIdentities.phoneNumber,
      })
      .from(authIdentities)
      .where(
        and(
          eq(authIdentities.userId, ownerMember.userId),
          eq(authIdentities.provider, "username_password"),
        ),
      )
      .limit(1);

    const phoneNumber = identity?.loginPhone || identity?.phoneNumber;
    if (!phoneNumber) {
      throw new ValidationError("Owner phone is not configured for this account.");
    }

    const setup = await createAccountSetupToken({
      organizationId,
      userId: ownerMember.userId,
      phoneNumber,
      ownerName: ownerMember.name,
      purpose,
      createdByUserId: actorUserId,
      publicOrigin: resolveAppPublicOrigin(request),
    });

    return ok(setup);
  } catch (error) {
    return fail(error);
  }
}
