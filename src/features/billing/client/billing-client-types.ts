import type { DisplayLang } from "@/core/i18n/display-locale";
import type {
  OrganizationEntitlementUsage,
  OwnerPlanSummary,
  PlanFeatureLabel,
  ResolvedOrganizationEntitlements,
} from "@/features/billing/types";

export type { ResolvedOrganizationEntitlements, OrganizationEntitlementUsage, PlanFeatureLabel, OwnerPlanSummary };

export type BillingLang = DisplayLang;

export type BillingAuthContext = {
  organizationId?: string;
  actorUserId?: string;
  actorRole?: string;
};

export type OrganizationEntitlementsCacheEntry = {
  entitlements: ResolvedOrganizationEntitlements | null;
  error: string;
};

export type BillingUpgradeToPaidSupportInput = {
  ownerName: string;
  currentPlanName: string;
  organizationName: string;
  accountNumber: number | null;
};

export type BillingUpgradeSupportInput = {
  ownerName: string;
  organizationName: string;
  accountNumber: number | null;
  currentPlanName: string;
  targetPlanName: string;
};

export type BillingRenewalSupportInput = {
  ownerName: string;
  organizationName: string;
  planDisplayNameAr: string;
  planDisplayNameEn: string;
  billingCycle: "monthly" | "yearly" | string;
  daysUntilEnd: number;
  periodEndIso: string;
};

export type OwnerAccountSummary = {
  organizationName?: string;
  accountNumber?: number | null;
  ownerName?: string;
};

export type OwnerProfileSummary = {
  name?: string;
};

export type SubscriptionRenewalBannerModel = {
  tone: "danger" | "warning" | "info";
  key: "expired" | "grace" | "soon3" | "soon7" | "soon14";
  daysRemaining: number;
  isTrial?: boolean;
  gracePeriodDays?: number;
};

export type PlanPickerRow = OwnerPlanSummary & {
  isCurrent?: boolean;
};

export type OwnerPlanChipProps = {
  lang: BillingLang;
  entitlements: ResolvedOrganizationEntitlements | null;
  entitlementsLoading: boolean;
  ownerProfile: OwnerProfileSummary | null;
  ownerAccount: OwnerAccountSummary | null;
};

export type OwnerPlanPickerModalProps = {
  lang: BillingLang;
  open: boolean;
  onClose: () => void;
  entitlements: ResolvedOrganizationEntitlements;
  ownerProfile: OwnerProfileSummary | null;
  ownerAccount: OwnerAccountSummary | null;
};

export type SubscriptionRenewalBannerProps = {
  lang: BillingLang;
  entitlements: ResolvedOrganizationEntitlements;
  ownerName?: string;
  organizationName?: string;
  onOpenSubscriptionSettings?: () => void;
  className?: string;
};

export type UseOrganizationEntitlementsProps = {
  enabled?: boolean;
  auth?: BillingAuthContext;
};

export type FormatPlanPriceOptions = {
  isTrialPlan?: boolean;
  billingCycle?: "monthly" | "yearly" | string;
  priceYearlyHalalas?: number | null;
};

export type FormatRenewalDaysOptions = {
  trialContext?: boolean;
};

export type SubscriptionStatusTone = "neutral" | "warning" | "navy";

export type SubscriptionStatusTable = Record<string, string>;
