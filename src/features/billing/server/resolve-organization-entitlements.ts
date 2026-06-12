import { desc, eq } from "drizzle-orm";
import { getDb } from "@/core/db/client";
import {
  organizationEntitlementOverrides,
  organizations,
  subscriptions,
} from "@/core/db/schema";
import { countOrganizationUsage } from "@/features/billing/server/count-organization-usage";
import {
  getPlanCatalogRow,
  listPlanCatalogRows,
} from "@/features/billing/server/plan-catalog-repository";
import { buildPlanFeatureLabels } from "@/features/billing/server/plan-feature-labels";
import { DEFAULT_PLAN_CODE, isTrialPlanCode } from "@/features/billing/plan-codes";
import type {
  OwnerPlanSummary,
  PlanCode,
  ResolvedOrganizationEntitlements,
} from "@/features/billing/types";

function resolveTrialDaysRemaining(periodEnd: Date | null | undefined): number | null {
  if (!periodEnd) return null;
  const diffMs = periodEnd.getTime() - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

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

  const planCode = (subscription?.planCode ?? DEFAULT_PLAN_CODE) as PlanCode;
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

  const catalogRows = await listPlanCatalogRows();
  const isTrialPlan = isTrialPlanCode(planCode) || plan.features.isTrialPlan === true;
  const upgradePlans: OwnerPlanSummary[] = catalogRows
    .filter((row) => row.isActive && (
      isTrialPlan
        ? !isTrialPlanCode(row.planCode) && row.features.isTrialPlan !== true
        : row.sortOrder > plan.sortOrder
    ))
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((row) => ({
      planCode: row.planCode,
      displayNameAr: row.displayNameAr,
      displayNameEn: row.displayNameEn,
      priceMonthlyHalalas: row.priceMonthlyHalalas,
      priceYearlyHalalas: row.priceYearlyHalalas,
      maxStores: row.maxStores,
      maxEmployees: row.maxEmployees,
      trialDays: row.trialDays,
      features: buildPlanFeatureLabels(row),
    }));

  return {
    organizationId,
    planCode,
    planDisplayNameAr: plan.displayNameAr,
    planDisplayNameEn: plan.displayNameEn,
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
    priceYearlyHalalas: plan.priceYearlyHalalas,
    trialDays: plan.trialDays,
    isTrialPlan,
    trialDaysRemaining: resolveTrialDaysRemaining(subscription?.currentPeriodEnd),
    currentPeriodEnd: subscription?.currentPeriodEnd
      ? subscription.currentPeriodEnd.toISOString()
      : null,
    features: buildPlanFeatureLabels(plan),
    upgradePlans,
    usage,
    overrides: {
      maxStores: overrides?.maxStoresOverride ?? null,
      maxEmployees: overrides?.maxEmployeesOverride ?? null,
      priceMonthlyHalalas: overrides?.priceMonthlyOverrideHalalas ?? null,
      notes: overrides?.notes ?? null,
    },
  };
}
