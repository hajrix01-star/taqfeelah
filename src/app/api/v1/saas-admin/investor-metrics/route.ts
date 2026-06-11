import { fail, ok } from "@/core/http/api-response";
import { getInvestorMetrics } from "@/features/saas-admin/server/get-investor-metrics";
import { assertSaasAdminRouteReady } from "@/features/saas-admin/server/saas-admin-route-guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { actorUserId } = assertSaasAdminRouteReady(request);
    const result = await getInvestorMetrics({ actorUserId });
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
