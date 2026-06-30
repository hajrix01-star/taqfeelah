import { readJsonBody } from "@/core/http/api-route-handler";
import { createSaasAccountStore } from "@/features/saas-admin/server/create-saas-account-store";
import {
  requireSaasAdminRouteParam,
  withSaasAdminApiRoute,
} from "@/features/saas-admin/server/saas-admin-api-route";

export const dynamic = "force-dynamic";

type Body = Record<string, unknown>;

export const POST = withSaasAdminApiRoute<{ id: string }>("accounts:write", async ({
  actor,
  params,
  request,
}) => {
  const organizationId = requireSaasAdminRouteParam(params.id, "Organization id");
  const body = await readJsonBody<Body>(request);

  const created = await createSaasAccountStore({
    actorUserId: actor.actorUserId,
    organizationId,
    name: typeof body?.name === "string" ? body.name : "",
    location: typeof body?.location === "string" ? body.location : undefined,
  });

  return { data: created, init: { status: 201 } };
});
