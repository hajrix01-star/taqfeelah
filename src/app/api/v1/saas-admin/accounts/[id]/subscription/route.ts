import { readJsonBody } from "@/core/http/api-route-handler";
import { parsePlanCode } from "@/features/billing/plan-codes";
import { updateSaasAccountSubscription } from "@/features/saas-admin/server/update-saas-account-subscription";
import {
  requireSaasAdminRouteParam,
  withSaasAdminApiRoute,
} from "@/features/saas-admin/server/saas-admin-api-route";

export const dynamic = "force-dynamic";

const SUBSCRIPTION_STATUSES = new Set(["trialing", "active", "past_due", "canceled"]);
const BILLING_CYCLES = new Set(["monthly", "yearly"]);
type Body = Record<string, unknown>;

export const PATCH = withSaasAdminApiRoute<{ id: string }>("accounts:write", async ({
  actor,
  params,
  request,
}) => {
  const organizationId = requireSaasAdminRouteParam(params.id, "Organization id");
  const body = await readJsonBody<Body>(request);
  const extendPeriodDays = typeof body?.extendPeriodDays === "number"
    ? body.extendPeriodDays
    : undefined;
  const rawStatus = typeof body?.status === "string" ? body.status : undefined;
  const rawBillingCycle = typeof body?.billingCycle === "string" ? body.billingCycle : undefined;

  return updateSaasAccountSubscription({
    actorUserId: actor.actorUserId,
    organizationId,
    planCode: parsePlanCode(body?.planCode) ?? undefined,
    status: rawStatus && SUBSCRIPTION_STATUSES.has(rawStatus)
      ? rawStatus as "trialing" | "active" | "past_due" | "canceled"
      : undefined,
    billingCycle: rawBillingCycle && BILLING_CYCLES.has(rawBillingCycle)
      ? rawBillingCycle as "monthly" | "yearly"
      : undefined,
    extendPeriodDays,
    activatePaid: body?.activatePaid === true,
    acknowledgeUsageExceedsLimits: body?.acknowledgeUsageExceedsLimits === true,
  });
});
