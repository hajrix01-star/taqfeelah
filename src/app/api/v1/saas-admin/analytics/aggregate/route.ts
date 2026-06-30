import { readJsonBody } from "@/core/http/api-route-handler";
import { aggregateSaasAnalytics } from "@/features/saas-admin/server/aggregate-saas-analytics";
import { withSaasAdminApiRouteNoParams } from "@/features/saas-admin/server/saas-admin-api-route";

export const dynamic = "force-dynamic";

export const POST = withSaasAdminApiRouteNoParams("analytics:aggregate", async ({ request }) => {
  let snapshotDate: string | undefined;
  try {
    const body = await readJsonBody<{ snapshotDate?: string }>(request);
    if (typeof body?.snapshotDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.snapshotDate)) {
      snapshotDate = body.snapshotDate;
    }
  } catch {
    snapshotDate = undefined;
  }

  return aggregateSaasAnalytics(snapshotDate);
});
