import { repairSaasAccountFoundation } from "@/features/saas-admin/server/repair-saas-account-foundation";
import {
  requireSaasAdminRouteParam,
  withSaasAdminApiRoute,
} from "@/features/saas-admin/server/saas-admin-api-route";

export const dynamic = "force-dynamic";

export const POST = withSaasAdminApiRoute<{ id: string }>("accounts:repair", ({ actor, params }) =>
  repairSaasAccountFoundation({
    actorUserId: actor.actorUserId,
    organizationId: requireSaasAdminRouteParam(params.id, "Organization id"),
  })
);
