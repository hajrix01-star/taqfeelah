import { getInvestorMetrics } from "@/features/saas-admin/server/get-investor-metrics";
import { withSaasAdminApiRouteNoParams } from "@/features/saas-admin/server/saas-admin-api-route";

export const dynamic = "force-dynamic";

export const GET = withSaasAdminApiRouteNoParams("investor-metrics:read", ({ actor }) =>
  getInvestorMetrics({ actorUserId: actor.actorUserId })
);
