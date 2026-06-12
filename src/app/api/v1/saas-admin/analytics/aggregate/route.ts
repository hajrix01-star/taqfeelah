import { fail, ok } from "@/core/http/api-response";
import { assertSaasAdminRouteReady } from "@/features/saas-admin/server/saas-admin-route-guard";
import { aggregateSaasAnalytics } from "@/features/saas-admin/server/aggregate-saas-analytics";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSaasAdminRouteReady(request);

    let snapshotDate: string | undefined;
    try {
      const body = await request.json() as { snapshotDate?: string };
      if (typeof body?.snapshotDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.snapshotDate)) {
        snapshotDate = body.snapshotDate;
      }
    } catch {
      snapshotDate = undefined;
    }

    const result = await aggregateSaasAnalytics(snapshotDate);
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
