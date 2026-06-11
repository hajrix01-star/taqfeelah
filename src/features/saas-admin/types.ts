export type AccountStatus = "trial" | "active" | "inactive" | "suspended";

export type PlanCode = "starter" | "growth" | "enterprise" | string | null;

export type MetricAvailability = "available" | "estimated" | "unavailable";

export type SaasOverviewKpis = {
  totalAccounts: number;
  activeAccounts: number;
  storesCount: number;
  usersCount: number;
  closeoutsThisMonth: number;
  operationsThisMonth: number;
  attachmentsCount: number;
  lastActivityAt: string | null;
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
  topActiveAccounts: AccountActivitySummary[];
  inactiveAccounts: AccountActivitySummary[];
  systemHealth: SystemHealthSummary;
  engagement: SaasEngagementMeta;
};

export type SaasAccountRow = {
  id: string;
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

export type SaasAccountDetails = {
  id: string;
  name: string;
  ownerName: string | null;
  status: AccountStatus;
  planCode: PlanCode;
  createdAt: string;
  lastActivityAt: string | null;
  storesCount: number;
  usersCount: number;
  closeoutsThisMonth: number;
  operationsCount: number;
  attachmentsCount: number;
  stores: Array<{ id: string; name: string; status: string; createdAt: string }>;
  users: Array<{ id: string; name: string; role: string; status: string }>;
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
  avgCloseoutsPerStore: number | null;
  avgOperationsPerAccount: number | null;
  topActiveAccounts: AccountActivitySummary[];
  inactiveAccounts: AccountActivitySummary[];
  lastActivityByAccount: Array<{
    id: string;
    name: string;
    lastActivityAt: string | null;
    daysSinceActivity: number | null;
  }>;
};

export type InvestorMetrics = {
  activeAccounts: number;
  activeStores: number;
  monthlyCloseouts: number;
  monthlyOperations: number;
  avgCloseoutsPerStore: number | null;
  attachmentsPerCloseout: number | null;
  estimatedMrr: { value: number | null; availability: MetricAvailability; label: string };
  estimatedArr: { value: number | null; availability: MetricAvailability; label: string };
  potentialMrr: { value: number | null; availability: MetricAvailability; label: string };
  growthRate: { value: number | null; availability: MetricAvailability };
  inactiveAccounts: number;
  retentionProxy: { value: number | null; availability: MetricAvailability };
  usageIntensity: { value: number | null; availability: MetricAvailability };
  currency: string;
  disclaimer: string;
};

export type SystemHealthReport = {
  api: { status: "healthy" | "unavailable"; message: string };
  database: { status: "healthy" | "unhealthy" | "unavailable"; message: string };
  lastDeploy: { value: string | null; availability: MetricAvailability };
  errorCount: { value: number | null; availability: MetricAvailability };
  failedRequests: { value: number | null; availability: MetricAvailability };
  attachmentsStorageBytes: { value: number | null; availability: MetricAvailability };
  lastCloseoutAt: string | null;
  lastAttachmentAt: string | null;
  lastApiUsageAt: string | null;
};
