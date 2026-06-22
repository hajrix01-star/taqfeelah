import { and, count, desc, eq, gte, lte, max, sql } from "drizzle-orm";
import { getDb } from "@/core/db/client";
import {
  attachments,
  dailyCloseouts,
  dailyOrgMetrics,
  dailySaasMetrics,
  entries,
  organizationMembers,
  organizations,
  orgEngagementSnapshots,
  stores,
  subscriptions,
} from "@/core/db/schema";
import {
  currentMonthRangeUtc,
  lastNDaysRangeUtc,
} from "@/features/saas-admin/server/saas-admin-utils";
import { halalasToRiyals, resolvePlanMrrHalalas } from "@/domain/saas-analytics/plan-pricing";
import type {
  EngagementSnapshotRow,
  PlatformMetric,
  PlatformSnapshot,
} from "@/features/saas-admin/server/platform-metrics/types";

function liveMetric<T>(value: T): PlatformMetric<T> {
  return { value, source: "live" };
}

function aggregatedMetric<T>(value: T): PlatformMetric<T> {
  return { value, source: "aggregated" };
}

function estimatedMetric<T>(value: T): PlatformMetric<T> {
  return { value, source: "estimated" };
}

function unavailableMetric<T>(value: T): PlatformMetric<T> {
  return { value, source: "live" };
}

export async function getPlatformSnapshot(): Promise<PlatformSnapshot> {
  const db = getDb();
  const month = currentMonthRangeUtc();
  const range30 = lastNDaysRangeUtc(30);

  const [orgCounts] = await db
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where ${organizations.status} = 'active')`,
    })
    .from(organizations);

  const [storeCount] = await db.select({ total: count() }).from(stores);
  const [activeStoreCount] = await db
    .select({ total: count() })
    .from(stores)
    .where(eq(stores.status, "active"));

  const [userCount] = await db
    .select({ total: count() })
    .from(organizationMembers)
    .where(eq(organizationMembers.status, "active"));

  const [closeoutsMonth] = await db
    .select({ total: count() })
    .from(dailyCloseouts)
    .where(
      and(
        eq(dailyCloseouts.status, "approved"),
        gte(dailyCloseouts.date, month.start),
        lte(dailyCloseouts.date, month.end),
      ),
    );

  const [operationsMonth] = await db
    .select({ total: count() })
    .from(entries)
    .where(
      and(
        eq(entries.status, "active"),
        gte(entries.date, month.start),
        lte(entries.date, month.end),
      ),
    );

  const [attachmentCount] = await db.select({ total: count() }).from(attachments);

  const [lastCloseout] = await db
    .select({ at: max(dailyCloseouts.createdAt) })
    .from(dailyCloseouts)
    .where(eq(dailyCloseouts.status, "approved"));
  const [lastEntry] = await db
    .select({ at: max(entries.createdAt) })
    .from(entries)
    .where(eq(entries.status, "active"));
  const [lastAttachment] = await db
    .select({ at: max(attachments.createdAt) })
    .from(attachments);

  const lastActivityCandidates = [
    lastCloseout?.at,
    lastEntry?.at,
    lastAttachment?.at,
  ].filter((value): value is Date => value instanceof Date);
  const lastActivityAt = lastActivityCandidates.length
    ? new Date(Math.max(...lastActivityCandidates.map((d) => d.getTime()))).toISOString()
    : null;

  const trendRows = await db
    .select({
      metricDate: dailyOrgMetrics.metricDate,
      closeouts: sql<number>`coalesce(sum(${dailyOrgMetrics.closeoutsSubmittedCount}), 0)`,
      operations: sql<number>`coalesce(sum(${dailyOrgMetrics.entriesCount}), 0)`,
    })
    .from(dailyOrgMetrics)
    .where(
      and(
        gte(dailyOrgMetrics.metricDate, range30.from),
        lte(dailyOrgMetrics.metricDate, range30.to),
      ),
    )
    .groupBy(dailyOrgMetrics.metricDate)
    .orderBy(dailyOrgMetrics.metricDate);

  const [latestSnapshot] = await db
    .select({ snapshotDate: orgEngagementSnapshots.snapshotDate })
    .from(orgEngagementSnapshots)
    .orderBy(desc(orgEngagementSnapshots.snapshotDate))
    .limit(1);

  const snapshotDate = latestSnapshot?.snapshotDate ?? null;
  let snapshotRows: EngagementSnapshotRow[] = [];
  let inactiveAccountsCount = 0;
  let retentionProxy: number | null = null;
  let usageIntensity: number | null = null;

  if (snapshotDate) {
    const rows = await db
      .select()
      .from(orgEngagementSnapshots)
      .where(eq(orgEngagementSnapshots.snapshotDate, snapshotDate))
      .orderBy(desc(orgEngagementSnapshots.closeoutsL30));

    snapshotRows = rows.map((row) => ({
      organizationId: row.organizationId,
      organizationName: row.organizationName,
      organizationStatus: row.organizationStatus,
      subscriptionStatus: row.subscriptionStatus,
      closeoutsL30: row.closeoutsL30,
      entriesL30: row.entriesL30,
      activeDaysL30: row.activeDaysL30,
      engagementSegment: row.engagementSegment,
      lastCoreActivityAt: row.lastCoreActivityAt,
      daysSinceLastCoreActivity: row.daysSinceLastCoreActivity,
    }));

    inactiveAccountsCount = snapshotRows.filter(
      (row) => row.engagementSegment === "dormant" || row.engagementSegment === "churned",
    ).length;

    const activeCount = snapshotRows.filter((row) => row.activeDaysL30 > 0).length;
    const total = snapshotRows.length;
    if (total > 0) {
      retentionProxy = Number(((activeCount / total) * 100).toFixed(2));
      usageIntensity = Number((activeCount / total).toFixed(2));
    }
  }

  const activeSubscriptions = await db
    .select({ planCode: subscriptions.planCode })
    .from(subscriptions)
    .where(eq(subscriptions.status, "active"));

  const estimatedMrrHalalas = activeSubscriptions.reduce(
    (sum, row) => sum + resolvePlanMrrHalalas(row.planCode),
    0,
  );
  const hasPaidSubscriptions = activeSubscriptions.length > 0;
  const planMrrValue = hasPaidSubscriptions ? halalasToRiyals(estimatedMrrHalalas) : null;
  const planArrValue = planMrrValue !== null ? Number((planMrrValue * 12).toFixed(2)) : null;

  const [latestMetrics] = await db
    .select()
    .from(dailySaasMetrics)
    .orderBy(desc(dailySaasMetrics.metricDate))
    .limit(1);

  const [previousMetrics] = await db
    .select()
    .from(dailySaasMetrics)
    .orderBy(desc(dailySaasMetrics.metricDate))
    .offset(1)
    .limit(1);

  const aggregatedMrr = latestMetrics
    ? halalasToRiyals(Number(latestMetrics.mrrHalalas || 0))
    : null;
  const useAggregatedMrr = aggregatedMrr !== null && aggregatedMrr > 0;

  let growthRate: number | null = null;
  let hasGrowthRate = false;
  if (latestMetrics && previousMetrics) {
    const current = Number(latestMetrics.activeOrganizationsCount || 0);
    const previous = Number(previousMetrics.activeOrganizationsCount || 0);
    if (previous > 0) {
      growthRate = Number((((current - previous) / previous) * 100).toFixed(2));
      hasGrowthRate = true;
    }
  }

  const closeoutTotal = Number(closeoutsMonth?.total || 0);
  const activeStoreTotal = Number(activeStoreCount?.total || 0);
  const avgCloseoutsPerActiveStore = activeStoreTotal > 0
    ? Number((closeoutTotal / activeStoreTotal).toFixed(2))
    : null;
  const attachmentsPerCloseout = closeoutTotal > 0
    ? Number((Number(attachmentCount?.total || 0) / closeoutTotal).toFixed(2))
    : null;

  const retentionMetric: PlatformMetric<number | null> = snapshotDate && retentionProxy !== null
    ? estimatedMetric(retentionProxy)
    : { value: null, source: "live" };

  const usageIntensityMetric: PlatformMetric<number | null> = snapshotDate && usageIntensity !== null
    ? estimatedMetric(usageIntensity)
    : { value: null, source: "live" };

  return {
    monthRange: month,
    totalAccounts: liveMetric(Number(orgCounts?.total || 0)),
    activeAccounts: liveMetric(Number(orgCounts?.active || 0)),
    storesCount: liveMetric(Number(storeCount?.total || 0)),
    activeStoresCount: liveMetric(activeStoreTotal),
    usersCount: liveMetric(Number(userCount?.total || 0)),
    closeoutsThisMonth: liveMetric(closeoutTotal),
    operationsThisMonth: liveMetric(Number(operationsMonth?.total || 0)),
    attachmentsCount: liveMetric(Number(attachmentCount?.total || 0)),
    lastActivityAt: liveMetric(lastActivityAt),
    activityTrend30d: trendRows.map((row) => ({
      date: row.metricDate,
      closeouts: Number(row.closeouts),
      operations: Number(row.operations),
    })),
    activityTrendSource: "aggregated",
    engagement: {
      snapshotDate,
      dataAvailable: Boolean(snapshotDate),
      inactiveAccountsCount: snapshotDate
        ? aggregatedMetric(inactiveAccountsCount)
        : unavailableMetric(0),
      retentionProxy: retentionMetric,
      usageIntensity: usageIntensityMetric,
      snapshotRows,
    },
    revenue: {
      estimatedMrr: useAggregatedMrr
        ? estimatedMetric(aggregatedMrr)
        : (hasPaidSubscriptions ? estimatedMetric(planMrrValue) : { value: null, source: "live" as const }),
      estimatedArr: useAggregatedMrr && aggregatedMrr !== null
        ? estimatedMetric(Number((aggregatedMrr * 12).toFixed(2)))
        : (hasPaidSubscriptions ? estimatedMetric(planArrValue) : { value: null, source: "live" as const }),
      potentialMrr: hasPaidSubscriptions
        ? estimatedMetric(planMrrValue)
        : { value: null, source: "live" as const },
      growthRate: hasGrowthRate
        ? aggregatedMetric(growthRate)
        : { value: null, source: "live" as const },
    },
    derived: {
      avgCloseoutsPerActiveStore: liveMetric(avgCloseoutsPerActiveStore),
      attachmentsPerCloseout: liveMetric(attachmentsPerCloseout),
    },
  };
}
