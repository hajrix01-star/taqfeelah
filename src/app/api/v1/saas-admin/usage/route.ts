import { fail, ok } from "@/core/http/api-response";
import { getSaasUsage } from "@/features/saas-admin/server/get-saas-usage";
import { assertSaasAdminRouteReady } from "@/features/saas-admin/server/saas-admin-route-guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { actorUserId } = await assertSaasAdminRouteReady(request);
    const { searchParams } = new URL(request.url);
    const monthsRaw = Number(searchParams.get("months") || "6");

    const result = await getSaasUsage({
      actorUserId,
      months: Number.isInteger(monthsRaw) && monthsRaw > 0 ? monthsRaw : 6,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
