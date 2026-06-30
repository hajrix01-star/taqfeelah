import { readJsonBody } from "@/core/http/api-route-handler";
import { updateSaasAccountOwner } from "@/features/saas-admin/server/update-saas-account-owner";
import {
  requireSaasAdminRouteParam,
  withSaasAdminApiRoute,
} from "@/features/saas-admin/server/saas-admin-api-route";

export const dynamic = "force-dynamic";

type Body = Record<string, unknown>;

export const PATCH = withSaasAdminApiRoute<{ id: string }>("accounts:write", async ({
  actor,
  params,
  request,
}) => {
  const organizationId = requireSaasAdminRouteParam(params.id, "Organization id");
  const body = await readJsonBody<Body>(request);

  return updateSaasAccountOwner({
    actorUserId: actor.actorUserId,
    organizationId,
    ownerName: typeof body?.ownerName === "string" ? body.ownerName : undefined,
    ownerUsername: typeof body?.ownerUsername === "string" ? body.ownerUsername : undefined,
    ownerPhone: typeof body?.ownerPhone === "string" ? body.ownerPhone : undefined,
    ownerPassword: typeof body?.ownerPassword === "string" ? body.ownerPassword : undefined,
  });
});
