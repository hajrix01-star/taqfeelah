import { scanSubscriptionRenewals } from "@/features/billing/server/scan-subscription-renewals";
import { withSaasAdminApiRouteNoParams } from "@/features/saas-admin/server/saas-admin-api-route";

export const dynamic = "force-dynamic";

export const POST = withSaasAdminApiRouteNoParams("analytics:aggregate", () =>
  scanSubscriptionRenewals()
);
