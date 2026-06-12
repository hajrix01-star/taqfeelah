import { fail, ok } from "@/core/http/api-response";
import { getSystemHealth } from "@/features/saas-admin/server/get-system-health";
import { assertSaasAdminRouteReady } from "@/features/saas-admin/server/saas-admin-route-guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { actorUserId } = await assertSaasAdminRouteReady(request, "system-health:read");
    const result = await getSystemHealth({ actorUserId });
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
