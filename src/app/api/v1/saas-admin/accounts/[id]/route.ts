import { readJsonBody } from "@/core/http/api-route-handler";
import { parsePlanCode } from "@/features/billing/plan-codes";
import { getSaasAccountDetails } from "@/features/saas-admin/server/get-saas-account-details";
import { updateSaasAccount } from "@/features/saas-admin/server/update-saas-account";
import {
  requireSaasAdminRouteParam,
  withSaasAdminApiRoute,
} from "@/features/saas-admin/server/saas-admin-api-route";

const LIFECYCLE_STATUSES = new Set(["active", "suspended", "archived"]);

export const dynamic = "force-dynamic";

type Body = Record<string, unknown>;

export const GET = withSaasAdminApiRoute<{ id: string }>("accounts:read", ({ actor, params }) =>
  getSaasAccountDetails({
    actorUserId: actor.actorUserId,
    organizationId: requireSaasAdminRouteParam(params.id, "Organization id"),
  })
);

export const PATCH = withSaasAdminApiRoute<{ id: string }>("accounts:write", async ({
  actor,
  params,
  request,
}) => {
  const body = await readJsonBody<Body>(request);
  const rawStatus = typeof body?.status === "string" ? body.status : undefined;

  return updateSaasAccount({
    actorUserId: actor.actorUserId,
    organizationId: requireSaasAdminRouteParam(params.id, "Organization id"),
    name: typeof body?.organizationName === "string" ? body.organizationName : undefined,
    status: rawStatus && LIFECYCLE_STATUSES.has(rawStatus)
      ? rawStatus as "active" | "suspended" | "archived"
      : undefined,
    planCode: parsePlanCode(body?.planCode) ?? undefined,
  });
});
