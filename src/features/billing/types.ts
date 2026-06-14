export type { PlanCode, PaidPlanCode } from "@/features/billing/plan-codes";
import type { PlanCode } from "@/features/billing/plan-codes";

export type PlanCatalogRow = {
  planCode: PlanCode;
  displayNameAr: string;
  displayNameEn: string;
  priceMonthlyHalalas: number;
  priceYearlyHalalas: number | null;
  maxStores: number;
  maxEmployees: number;
  trialDays: number;
  features: Record<string, unknown>;
  isActive: boolean;
  sortOrder: number;
};

export type OrganizationEntitlementUsage = {
  activeStores: number;
  activeEmployees: number;
  pendingInvitations: number;
};

export type PlanFeatureLabel = {
  key: string;
  labelAr: string;
  labelEn: string;
};

export type OwnerPlanSummary = {
  planCode: PlanCode;
  displayNameAr: string;
  displayNameEn: string;
  priceMonthlyHalalas: number;
  priceYearlyHalalas: number | null;
  maxStores: number;
  maxEmployees: number;
  trialDays: number;
  features: PlanFeatureLabel[];
};

export type ResolvedOrganizationEntitlements = {
  organizationId: string;
  planCode: PlanCode;
  planDisplayNameAr: string;
  planDisplayNameEn: string;
  subscriptionStatus: string | null;
  organizationStatus: string;
  billingCycle: "monthly" | "yearly";
  billingAllowed: boolean;
  maxStores: number;
  maxEmployees: number;
  priceMonthlyHalalas: number;
  priceYearlyHalalas: number | null;
  trialDays: number;
  isTrialPlan: boolean;
  trialDaysRemaining: number | null;
  renewalDaysRemaining: number | null;
  subscriptionPeriodPhase: "active" | "grace" | "expired";
  renewalReminderTier: 14 | 7 | 3 | null;
  gracePeriodDays: number;
  currentPeriodEnd: string | null;
  features: PlanFeatureLabel[];
  upgradePlans: OwnerPlanSummary[];
  usage: OrganizationEntitlementUsage;
  overrides: {
    maxStores: number | null;
    maxEmployees: number | null;
    priceMonthlyHalalas: number | null;
    notes: string | null;
  };
};

export type EntitlementAction = "add_store" | "invite_employee" | "activate_employee" | "use_app";
