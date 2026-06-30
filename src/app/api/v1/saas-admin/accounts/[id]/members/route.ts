import { readJsonBody } from "@/core/http/api-route-handler";
import { createSaasAccountMember } from "@/features/saas-admin/server/create-saas-account-member";
import {
  requireSaasAdminRouteParam,
  withSaasAdminApiRoute,
} from "@/features/saas-admin/server/saas-admin-api-route";

export const dynamic = "force-dynamic";

type Body = Record<string, unknown>;

export const POST = withSaasAdminApiRoute<{ id: string }>("accounts:members:write", async ({
  actor,
  params,
  request,
}) => {
  const organizationId = requireSaasAdminRouteParam(params.id, "Organization id");
  const body = await readJsonBody<Body>(request);
  const storeIds = Array.isArray(body?.storeIds)
    ? body.storeIds.filter((value: unknown) => typeof value === "string")
    : [];

  const created = await createSaasAccountMember({
    actorUserId: actor.actorUserId,
    organizationId,
    name: typeof body?.name === "string" ? body.name : "",
    role: body?.role === "manager" || body?.role === "employee" ? body.role : "employee",
    pin: typeof body?.pin === "string" ? body.pin : "",
    loginPhone: typeof body?.loginPhone === "string" ? body.loginPhone : undefined,
    storeIds,
  });

  return { data: created, init: { status: 201 } };
});
