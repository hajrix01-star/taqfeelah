export type PlanCode = "starter" | "growth" | "enterprise";

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

export type ResolvedOrganizationEntitlements = {
  organizationId: string;
  planCode: PlanCode;
  subscriptionStatus: string | null;
  organizationStatus: string;
  billingAllowed: boolean;
  maxStores: number;
  maxEmployees: number;
  priceMonthlyHalalas: number;
  trialDays: number;
  usage: OrganizationEntitlementUsage;
  overrides: {
    maxStores: number | null;
    maxEmployees: number | null;
    priceMonthlyHalalas: number | null;
    notes: string | null;
  };
};

export type EntitlementAction = "add_store" | "invite_employee" | "activate_employee" | "use_app";
