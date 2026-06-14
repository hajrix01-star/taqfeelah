import { fail, ok } from "@/core/http/api-response";
import { assertSaasAdminRouteReady } from "@/features/saas-admin/server/saas-admin-route-guard";
import { scanSubscriptionRenewals } from "@/features/billing/server/scan-subscription-renewals";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await assertSaasAdminRouteReady(request, "analytics:aggregate");
    const result = await scanSubscriptionRenewals();
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
