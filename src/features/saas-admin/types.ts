import type { ResolvedOrganizationEntitlements } from "@/features/billing/types";

export type AccountStatus = "trial" | "active" | "inactive" | "suspended" | "archived";

export type OrganizationLifecycleStatus = "active" | "suspended" | "archived" | "pending_activation";

export type PlanCode = "starter" | "growth" | "enterprise" | string | null;

export type MetricAvailability = "available" | "estimated" | "unavailable";

export type MetricSource = "live" | "aggregated" | "estimated";

export type MetricWithSource<T> = {
  value: T;
  source: MetricSource;
};

export type SaasOverviewKpis = {
  totalAccounts: MetricWithSource<number>;
  activeAccounts: MetricWithSource<number>;
  storesCount: MetricWithSource<number>;
  usersCount: MetricWithSource<number>;
  closeoutsThisMonth: MetricWithSource<number>;
  operationsThisMonth: MetricWithSource<number>;
  attachmentsCount: MetricWithSource<number>;
  lastActivityAt: MetricWithSource<string | null>;
};

export type ActivityTrendPoint = {
  date: string;
  closeouts: number;
  operations: number;
};

export type AccountActivitySummary = {
  id: string;
  name: string;
  ownerName: string | null;
  closeoutsThisMonth: number;
  lastActivityAt: string | null;
  status: AccountStatus;
};

export type SystemHealthSummary = {
  database: "healthy" | "unhealthy" | "unavailable";
  api: "healthy" | "unavailable";
};

export type SaasEngagementMeta = {
  snapshotDate: string | null;
  dataAvailable: boolean;
};

export type SaasOverview = {
  kpis: SaasOverviewKpis;
  activityTrend: ActivityTrendPoint[];
  activityTrendSource: MetricSource;
  topActiveAccounts: AccountActivitySummary[];
  inactiveAccounts: AccountActivitySummary[];
  systemHealth: SystemHealthSummary;
  engagement: SaasEngagementMeta;
};

export type SaasAccountRow = {
  id: string;
  accountNumber: number;
  name: string;
  ownerName: string | null;
  storesCount: number;
  usersCount: number;
  closeoutsThisMonth: number;
  lastActivityAt: string | null;
  planCode: PlanCode;
  status: AccountStatus;
  createdAt: string;
};

export type SaasAccountsList = {
  accounts: SaasAccountRow[];
  total: number;
  page: number;
  pageSize: number;
};

export type SaasAccountSubscriptionSnapshot = {
  id: string;
  planCode: string;
  status: string;
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
};

export type SaasAccountDetails = {
  id: string;
  accountNumber: number;
  name: string;
  ownerName: string | null;
  ownerUsername: string | null;
  ownerPhone: string | null;
  ownerMemberId: string | null;
  status: AccountStatus;
  organizationStatus: OrganizationLifecycleStatus;
  planCode: PlanCode;
  subscription: SaasAccountSubscriptionSnapshot | null;
  entitlements: ResolvedOrganizationEntitlements | null;
  createdAt: string;
  lastActivityAt: string | null;
  storesCount: number;
  usersCount: number;
  closeoutsThisMonth: number;
  operationsCount: number;
  attachmentsCount: number;
  stores: Array<{
    id: string;
    name: string;
    location: string;
    status: string;
    createdAt: string;
  }>;
  users: Array<{
    memberId: string;
    userId: string;
    name: string;
    role: string;
    status: string;
    loginPhone: string | null;
    storeIds: string[];
    storeAccess: Array<{
      storeId: string;
      storeName: string;
      storeStatus: string;
    }>;
  }>;
  recentCloseouts: Array<{
    id: string;
    storeName: string;
    date: string;
    status: string;
    createdAt: string;
  }>;
  recentOperations: Array<{
    id: string;
    storeName: string;
    type: string;
    date: string;
    createdAt: string;
  }>;
  monthlyUsage: Array<{
    month: string;
    closeouts: number;
    operations: number;
    attachments: number;
  }>;
  attachments: Array<{
    id: string;
    storeName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
  }>;
};

export type SaasUsageReport = {
  monthlyTrend: Array<{
    month: string;
    closeouts: number;
    operations: number;
    attachments: number;
  }>;
  monthlyTrendSource: MetricSource;
  avgCloseoutsPerStore: MetricWithSource<number | null>;
  avgOperationsPerAccount: MetricWithSource<number | null>;
  topActiveAccounts: AccountActivitySummary[];
  inactiveAccounts: AccountActivitySummary[];
  lastActivityByAccount: Array<{
    id: string;
    name: string;
    lastActivityAt: string | null;
    daysSinceActivity: number | null;
  }>;
};

export type InvestorMetricField<T> = {
  value: T;
  source: MetricSource;
  availability: MetricAvailability;
  label?: string;
};

export type InvestorMetrics = {
  activeAccounts: InvestorMetricField<number>;
  activeStores: InvestorMetricField<number>;
  monthlyCloseouts: InvestorMetricField<number>;
  monthlyOperations: InvestorMetricField<number>;
  avgCloseoutsPerStore: InvestorMetricField<number | null>;
  attachmentsPerCloseout: InvestorMetricField<number | null>;
  estimatedMrr: InvestorMetricField<number | null>;
  estimatedArr: InvestorMetricField<number | null>;
  potentialMrr: InvestorMetricField<number | null>;
  growthRate: InvestorMetricField<number | null>;
  inactiveAccounts: InvestorMetricField<number>;
  retentionProxy: InvestorMetricField<number | null>;
  usageIntensity: InvestorMetricField<number | null>;
  currency: string;
};

export type ReleaseInfo = {
  version: string;
  label: string;
  build: string;
};

export type SystemHealthReport = {
  api: { status: "healthy" | "unavailable"; message: string };
  database: { status: "healthy" | "unhealthy" | "unavailable"; message: string };
  release: ReleaseInfo;
  lastDeploy: { value: string | null; availability: MetricAvailability };
  errorCount: { value: number | null; availability: MetricAvailability };
  failedRequests: { value: number | null; availability: MetricAvailability };
  attachmentsStorageBytes: { value: number | null; availability: MetricAvailability };
  lastCloseoutAt: string | null;
  lastAttachmentAt: string | null;
  lastApiUsageAt: string | null;
};
