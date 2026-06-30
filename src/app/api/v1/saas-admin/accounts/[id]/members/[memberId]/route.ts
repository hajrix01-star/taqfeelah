import { readJsonBody } from "@/core/http/api-route-handler";
import { updateSaasAccountMember } from "@/features/saas-admin/server/update-saas-account-member";
import {
  requireSaasAdminRouteParam,
  withSaasAdminApiRoute,
} from "@/features/saas-admin/server/saas-admin-api-route";

export const dynamic = "force-dynamic";

type Body = Record<string, unknown>;

export const PATCH = withSaasAdminApiRoute<{ id: string; memberId: string }>(
  "accounts:members:write",
  async ({ actor, params, request }) => {
    const organizationId = requireSaasAdminRouteParam(params.id, "Organization id");
    const memberId = requireSaasAdminRouteParam(params.memberId, "Member id");
    const body = await readJsonBody<Body>(request);
    const storeIds = Array.isArray(body?.storeIds)
      ? body.storeIds.filter((value: unknown) => typeof value === "string")
      : undefined;

    return updateSaasAccountMember({
      actorUserId: actor.actorUserId,
      organizationId,
      memberId,
      name: typeof body?.name === "string" ? body.name : undefined,
      role: body?.role === "manager" || body?.role === "employee" ? body.role : undefined,
      status: body?.status === "active" || body?.status === "inactive" ? body.status : undefined,
      pin: typeof body?.pin === "string" ? body.pin : undefined,
      loginPhone: typeof body?.loginPhone === "string" ? body.loginPhone : undefined,
      storeIds,
    });
  },
);
