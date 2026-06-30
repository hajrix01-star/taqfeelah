import { getSaasOverview } from "@/features/saas-admin/server/get-saas-overview";
import { withSaasAdminApiRouteNoParams } from "@/features/saas-admin/server/saas-admin-api-route";

export const dynamic = "force-dynamic";

export const GET = withSaasAdminApiRouteNoParams("overview:read", ({ actor }) =>
  getSaasOverview({ actorUserId: actor.actorUserId })
);
