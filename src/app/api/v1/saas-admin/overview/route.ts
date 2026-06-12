import { fail, ok } from "@/core/http/api-response";
import { getSaasOverview } from "@/features/saas-admin/server/get-saas-overview";
import { assertSaasAdminRouteReady } from "@/features/saas-admin/server/saas-admin-route-guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { actorUserId } = await assertSaasAdminRouteReady(request, "overview:read");
    const result = await getSaasOverview({ actorUserId });
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
