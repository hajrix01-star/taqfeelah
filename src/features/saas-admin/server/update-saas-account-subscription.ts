import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { auditEvents, subscriptions } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import {
  isPaidPlanCode,
  isTrialPlanCode,
  PLAN_CODES,
  type PlanCode,
} from "@/features/billing/plan-codes";
import { countOrganizationUsage } from "@/features/billing/server/count-organization-usage";
import { getPlanCatalogRow } from "@/features/billing/server/plan-catalog-repository";
import { resolveOrganizationEntitlements } from "@/features/billing/server/resolve-organization-entitlements";

const SUBSCRIPTION_STATUSES = ["trialing", "active", "past_due", "canceled"] as const;
const BILLING_CYCLES = ["monthly", "yearly"] as const;

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
  organizationId: z.string().uuid(),
  planCode: z.enum(PLAN_CODES).optional(),
  status: z.enum(SUBSCRIPTION_STATUSES).optional(),
  billingCycle: z.enum(BILLING_CYCLES).optional(),
  extendPeriodDays: z.number().int().min(1).max(365).optional(),
  activatePaid: z.boolean().optional(),
  acknowledgeUsageExceedsLimits: z.boolean().optional(),
}).refine(
  (value) =>
    value.planCode
    || value.status
    || value.billingCycle
    || value.extendPeriodDays != null
    || value.activatePaid === true,
  { message: "At least one subscription field must be provided." },
);

function addUtcDays(base: Date, days: number): Date {
  const result = new Date(base);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function billingCycleDays(cycle: "monthly" | "yearly"): number {
  return cycle === "yearly" ? 365 : 30;
}

function resolvePeriodAnchor(periodEnd: Date, now: Date): Date {
  return periodEnd.getTime() < now.getTime() ? now : periodEnd;
}

async function assertPlanUsageFitsLimits(input: {
  organizationId: string;
  planCode: PlanCode;
  acknowledgeUsageExceedsLimits?: boolean;
}) {
  const plan = await getPlanCatalogRow(input.planCode);
  if (!plan) {
    throw new ValidationError("Invalid plan code.");
  }
  if (!plan.isActive) {
    throw new ValidationError("Selected plan is not active in the catalog.");
  }

  const usage = await countOrganizationUsage(input.organizationId);
  const seatUsage = usage.activeEmployees + usage.pendingInvitations;
  const exceedsStores = usage.activeStores > plan.maxStores;
  const exceedsEmployees = seatUsage > plan.maxEmployees;

  if ((exceedsStores || exceedsEmployees) && !input.acknowledgeUsageExceedsLimits) {
    throw new ValidationError(
      "Current usage exceeds the selected plan limits. Confirm downgrade or reduce usage first.",
      {
        fieldErrors: {
          usageExceedsLimits: [
            exceedsStores
              ? `Active stores (${usage.activeStores}) exceed plan limit (${plan.maxStores}).`
              : "",
            exceedsEmployees
              ? `Seats in use (${seatUsage}) exceed plan limit (${plan.maxEmployees}).`
              : "",
          ].filter(Boolean),
        },
        usage: {
          activeStores: usage.activeStores,
          seatUsage,
          maxStores: plan.maxStores,
          maxEmployees: plan.maxEmployees,
        },
      },
    );
  }
}

export type UpdateSaasAccountSubscriptionResult = {
  organizationId: string;
  subscriptionId: string;
  planCode: PlanCode;
  status: string;
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  changeType: "upgrade" | "downgrade" | "renewal" | "status" | "mixed";
  entitlements: Awaited<ReturnType<typeof resolveOrganizationEntitlements>>;
  updatedAt: string;
};

export async function updateSaasAccountSubscription(
  rawInput: z.infer<typeof inputSchema>,
): Promise<UpdateSaasAccountSubscriptionResult> {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid subscription update input.", parsed.error.flatten());
  }
  const input = parsed.data;
  const db = getDb();
  const now = new Date();

  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, input.organizationId))
    .orderBy(desc(subscriptions.updatedAt))
    .limit(1);

  if (!subscription?.id) {
    throw new ValidationError("Subscription was not found for this organization.");
  }

  const previousPlan = await getPlanCatalogRow(subscription.planCode);
  if (!previousPlan) {
    throw new ValidationError("Current subscription plan is unknown in the catalog.");
  }

  const nextPlanCode = (input.planCode ?? subscription.planCode) as PlanCode;
  const nextPlan = await getPlanCatalogRow(nextPlanCode);
  if (!nextPlan) {
    throw new ValidationError("Invalid plan code.");
  }
  if (!nextPlan.isActive) {
    throw new ValidationError("Selected plan is not active in the catalog.");
  }

  const isDowngrade = nextPlan.sortOrder < previousPlan.sortOrder;
  const isUpgrade = nextPlan.sortOrder > previousPlan.sortOrder;
  const planChanged = nextPlanCode !== subscription.planCode;

  if (planChanged) {
    await assertPlanUsageFitsLimits({
      organizationId: input.organizationId,
      planCode: nextPlanCode,
      acknowledgeUsageExceedsLimits: input.acknowledgeUsageExceedsLimits,
    });
  }

  let nextStatus = input.status ?? subscription.status;
  let nextBillingCycle = (input.billingCycle ?? subscription.billingCycle) as "monthly" | "yearly";
  let nextPeriodStart = subscription.currentPeriodStart;
  let nextPeriodEnd = subscription.currentPeriodEnd;
  let nextCancelAtPeriodEnd = subscription.cancelAtPeriodEnd;

  const activatingPaid =
    input.activatePaid === true
    || (planChanged && isPaidPlanCode(nextPlanCode) && isTrialPlanCode(subscription.planCode));

  if (activatingPaid && isPaidPlanCode(nextPlanCode)) {
    nextStatus = "active";
    nextBillingCycle = input.billingCycle ?? subscription.billingCycle as "monthly" | "yearly";
    nextPeriodStart = now;
    nextPeriodEnd = addUtcDays(now, billingCycleDays(nextBillingCycle));
    nextCancelAtPeriodEnd = false;
  }

  if (input.extendPeriodDays != null) {
    const anchor = resolvePeriodAnchor(nextPeriodEnd, now);
    nextPeriodEnd = addUtcDays(anchor, input.extendPeriodDays);
    if (nextStatus === "trialing" && nextPeriodEnd.getTime() > now.getTime()) {
      nextCancelAtPeriodEnd = false;
    }
  }

  if (input.status && !activatingPaid) {
    nextStatus = input.status;
    if (input.status === "active" && nextPeriodEnd.getTime() < now.getTime()) {
      nextPeriodStart = now;
      nextPeriodEnd = addUtcDays(now, billingCycleDays(nextBillingCycle));
    }
  }

  if (input.billingCycle && !activatingPaid && input.extendPeriodDays == null) {
    nextBillingCycle = input.billingCycle;
  }

  if (planChanged && isTrialPlanCode(nextPlanCode) && !input.status) {
    nextStatus = "trialing";
    if (!input.extendPeriodDays) {
      nextPeriodStart = now;
      nextPeriodEnd = addUtcDays(now, nextPlan.trialDays);
    }
  }

  let changeType: UpdateSaasAccountSubscriptionResult["changeType"] = "mixed";
  if (input.extendPeriodDays != null && !planChanged && !input.status) {
    changeType = "renewal";
  } else if (planChanged && isUpgrade) {
    changeType = "upgrade";
  } else if (planChanged && isDowngrade) {
    changeType = "downgrade";
  } else if (input.status && !planChanged) {
    changeType = "status";
  }

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(subscriptions)
      .set({
        planCode: nextPlanCode,
        status: nextStatus,
        billingCycle: nextBillingCycle,
        currentPeriodStart: nextPeriodStart,
        currentPeriodEnd: nextPeriodEnd,
        cancelAtPeriodEnd: nextCancelAtPeriodEnd,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, subscription.id))
      .returning();

    if (!updated?.id) {
      throw new ValidationError("Failed to update subscription.");
    }

    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: "saas_subscription_updated",
      metadata: {
        changeType,
        previous: {
          planCode: subscription.planCode,
          status: subscription.status,
          billingCycle: subscription.billingCycle,
          currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        },
        next: {
          planCode: updated.planCode,
          status: updated.status,
          billingCycle: updated.billingCycle,
          currentPeriodEnd: updated.currentPeriodEnd.toISOString(),
        },
        activatePaid: activatingPaid,
        extendPeriodDays: input.extendPeriodDays ?? null,
        acknowledgedUsageExceedsLimits: input.acknowledgeUsageExceedsLimits ?? false,
      },
    });

    const entitlements = await resolveOrganizationEntitlements(input.organizationId);

    return {
      organizationId: input.organizationId,
      subscriptionId: updated.id,
      planCode: updated.planCode as PlanCode,
      status: updated.status,
      billingCycle: updated.billingCycle,
      currentPeriodStart: updated.currentPeriodStart.toISOString(),
      currentPeriodEnd: updated.currentPeriodEnd.toISOString(),
      cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
      changeType,
      entitlements,
      updatedAt: updated.updatedAt.toISOString(),
    };
  });
}
