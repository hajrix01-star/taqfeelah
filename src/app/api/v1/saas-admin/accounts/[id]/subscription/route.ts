import { fail, ok } from "@/core/http/api-response";
import { ValidationError } from "@/core/errors/app-error";
import { parsePlanCode } from "@/features/billing/plan-codes";
import { updateSaasAccountSubscription } from "@/features/saas-admin/server/update-saas-account-subscription";
import { assertSaasAdminRouteReady } from "@/features/saas-admin/server/saas-admin-route-guard";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const SUBSCRIPTION_STATUSES = new Set(["trialing", "active", "past_due", "canceled"]);
const BILLING_CYCLES = new Set(["monthly", "yearly"]);

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { actorUserId } = await assertSaasAdminRouteReady(request, "accounts:write");
    const { id } = await context.params;
    if (!id?.trim()) {
      throw new ValidationError("Organization id is required.");
    }

    const body = await request.json();
    const extendPeriodDays = typeof body?.extendPeriodDays === "number"
      ? body.extendPeriodDays
      : undefined;
    const rawStatus = typeof body?.status === "string" ? body.status : undefined;
    const rawBillingCycle = typeof body?.billingCycle === "string" ? body.billingCycle : undefined;

    const result = await updateSaasAccountSubscription({
      actorUserId,
      organizationId: id.trim(),
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

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
