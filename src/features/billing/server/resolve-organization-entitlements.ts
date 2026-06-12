import { desc, eq } from "drizzle-orm";
import { getDb } from "@/core/db/client";
import {
  organizationEntitlementOverrides,
  organizations,
  subscriptions,
} from "@/core/db/schema";
import { countOrganizationUsage } from "@/features/billing/server/count-organization-usage";
import { getPlanCatalogRow } from "@/features/billing/server/plan-catalog-repository";
import type { PlanCode, ResolvedOrganizationEntitlements } from "@/features/billing/types";

function isBillingAllowed(input: {
  organizationStatus: string;
  subscriptionStatus: string | null;
  periodEnd: Date | null;
}): boolean {
  if (input.organizationStatus === "suspended") return false;
  if (input.organizationStatus === "pending_activation") return false;

  if (!input.subscriptionStatus) return true;

  if (input.subscriptionStatus === "active" || input.subscriptionStatus === "trialing") {
    if (input.periodEnd && input.periodEnd.getTime() < Date.now()) {
      return input.subscriptionStatus === "trialing" ? false : true;
    }
    return true;
  }

  return false;
}

export async function resolveOrganizationEntitlements(
  organizationId: string,
): Promise<ResolvedOrganizationEntitlements> {
  const db = getDb();

  const [organization] = await db
    .select({ status: organizations.status })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  if (!organization) {
    throw new Error("Organization not found.");
  }

  const [subscription] = await db
    .select({
      planCode: subscriptions.planCode,
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
    })
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, organizationId))
    .orderBy(desc(subscriptions.updatedAt))
    .limit(1);

  const planCode = (subscription?.planCode ?? "starter") as PlanCode;
  const plan = await getPlanCatalogRow(planCode);
  if (!plan) {
    throw new Error(`Unknown plan code: ${planCode}`);
  }

  const [overrides] = await db
    .select()
    .from(organizationEntitlementOverrides)
    .where(eq(organizationEntitlementOverrides.organizationId, organizationId))
    .limit(1);

  const usage = await countOrganizationUsage(organizationId);

  const maxStores = overrides?.maxStoresOverride ?? plan.maxStores;
  const maxEmployees = overrides?.maxEmployeesOverride ?? plan.maxEmployees;
  const priceMonthlyHalalas = overrides?.priceMonthlyOverrideHalalas ?? plan.priceMonthlyHalalas;

  return {
    organizationId,
    planCode,
    subscriptionStatus: subscription?.status ?? null,
    organizationStatus: organization.status,
    billingAllowed: isBillingAllowed({
      organizationStatus: organization.status,
      subscriptionStatus: subscription?.status ?? null,
      periodEnd: subscription?.currentPeriodEnd ?? null,
    }),
    maxStores,
    maxEmployees,
    priceMonthlyHalalas,
    trialDays: plan.trialDays,
    usage,
    overrides: {
      maxStores: overrides?.maxStoresOverride ?? null,
      maxEmployees: overrides?.maxEmployeesOverride ?? null,
      priceMonthlyHalalas: overrides?.priceMonthlyOverrideHalalas ?? null,
      notes: overrides?.notes ?? null,
    },
  };
}
