import type { AccountActivitySummary, ActivityTrendPoint } from "@/features/saas-admin/types";

export type MetricSource = "live" | "aggregated" | "estimated";

export type PlatformMetric<T> = {
  value: T;
  source: MetricSource;
};

export type EngagementSnapshotRow = {
  organizationId: string;
  organizationName: string;
  organizationStatus: string;
  subscriptionStatus: string | null;
  closeoutsL30: number;
  entriesL30: number;
  activeDaysL30: number;
  engagementSegment: string;
  lastCoreActivityAt: Date | null;
  daysSinceLastCoreActivity: number | null;
};

export type PlatformSnapshot = {
  monthRange: { start: string; end: string };
  totalAccounts: PlatformMetric<number>;
  activeAccounts: PlatformMetric<number>;
  storesCount: PlatformMetric<number>;
  activeStoresCount: PlatformMetric<number>;
  usersCount: PlatformMetric<number>;
  closeoutsThisMonth: PlatformMetric<number>;
  operationsThisMonth: PlatformMetric<number>;
  attachmentsCount: PlatformMetric<number>;
  lastActivityAt: PlatformMetric<string | null>;
  activityTrend30d: ActivityTrendPoint[];
  activityTrendSource: MetricSource;
  engagement: {
    snapshotDate: string | null;
    dataAvailable: boolean;
    inactiveAccountsCount: PlatformMetric<number | null>;
    retentionProxy: PlatformMetric<number | null>;
    usageIntensity: PlatformMetric<number | null>;
    snapshotRows: EngagementSnapshotRow[];
  };
  revenue: {
    estimatedMrr: PlatformMetric<number | null>;
    estimatedArr: PlatformMetric<number | null>;
    potentialMrr: PlatformMetric<number | null>;
    growthRate: PlatformMetric<number | null>;
  };
  derived: {
    avgCloseoutsPerActiveStore: PlatformMetric<number | null>;
    attachmentsPerCloseout: PlatformMetric<number | null>;
  };
};

export type EngagementAccountLists = {
  topActiveAccounts: AccountActivitySummary[];
  inactiveAccounts: AccountActivitySummary[];
  lastActivityByAccount: Array<{
    id: string;
    name: string;
    lastActivityAt: string | null;
    daysSinceActivity: number | null;
  }>;
};
