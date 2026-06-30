import { resolveAppPublicOrigin } from "@/core/auth/app-origin";
import { readJsonBody } from "@/core/http/api-route-handler";
import { ValidationError } from "@/core/errors/app-error";
import { createAccountSetupToken } from "@/features/account-setup/server/create-account-setup-token";
import { resolveOrganizationOwnerMember } from "@/features/saas-admin/server/resolve-organization-owner-member";
import {
  requireSaasAdminRouteParam,
  withSaasAdminApiRoute,
} from "@/features/saas-admin/server/saas-admin-api-route";
import { getDb } from "@/core/db/client";
import { authIdentities } from "@/core/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Body = Record<string, unknown>;

export const POST = withSaasAdminApiRoute<{ id: string }>("accounts:setup-link", async ({
  actor,
  params,
  request,
}) => {
  const organizationId = requireSaasAdminRouteParam(params.id, "Organization id");
  const body = await readJsonBody<Body>(request);
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

  return createAccountSetupToken({
    organizationId,
    userId: ownerMember.userId,
    phoneNumber,
    ownerName: ownerMember.name,
    purpose,
    createdByUserId: actor.actorUserId,
    publicOrigin: resolveAppPublicOrigin(request),
  });
});
