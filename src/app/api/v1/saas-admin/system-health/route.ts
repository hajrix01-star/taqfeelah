import { getSystemHealth } from "@/features/saas-admin/server/get-system-health";
import { withSaasAdminApiRouteNoParams } from "@/features/saas-admin/server/saas-admin-api-route";

export const dynamic = "force-dynamic";

export const GET = withSaasAdminApiRouteNoParams("system-health:read", ({ actor }) =>
  getSystemHealth({ actorUserId: actor.actorUserId })
);
