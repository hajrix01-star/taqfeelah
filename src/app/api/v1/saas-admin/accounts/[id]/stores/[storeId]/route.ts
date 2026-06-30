import { readJsonBody } from "@/core/http/api-route-handler";
import { updateSaasAccountStore } from "@/features/saas-admin/server/update-saas-account-store";
import {
  requireSaasAdminRouteParam,
  withSaasAdminApiRoute,
} from "@/features/saas-admin/server/saas-admin-api-route";

export const dynamic = "force-dynamic";

type Body = Record<string, unknown>;

export const PATCH = withSaasAdminApiRoute<{ id: string; storeId: string }>("accounts:write", async ({
  actor,
  params,
  request,
}) => {
  const organizationId = requireSaasAdminRouteParam(params.id, "Organization id");
  const storeId = requireSaasAdminRouteParam(params.storeId, "Store id");
  const body = await readJsonBody<Body>(request);

  return updateSaasAccountStore({
    actorUserId: actor.actorUserId,
    organizationId,
    storeId,
    name: typeof body?.name === "string" ? body.name : undefined,
    location: typeof body?.location === "string" ? body.location : undefined,
    status: body?.status === "active" || body?.status === "archived" ? body.status : undefined,
    reason: typeof body?.reason === "string" ? body.reason : undefined,
  });
});
