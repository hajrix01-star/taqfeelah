import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { assertPlatformAdminAccess } from "@/core/auth/assert-platform-admin-access";
import { getDb } from "@/core/db/client";
import {
  attachments,
  dailyCloseouts,
  dailySaasMetrics,
  entries,
  orgEngagementSnapshots,
  organizations,
  stores,
  subscriptions,
} from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import type { InvestorMetrics, MetricAvailability } from "@/features/saas-admin/types";
import { currentMonthRangeUtc } from "@/features/saas-admin/server/saas-admin-utils";
import { halalasToRiyals, resolvePlanMrrHalalas } from "@/domain/saas-analytics/plan-pricing";

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
});

function metric(
  value: number | null,
  availability: MetricAvailability,
): { value: number | null; availability: MetricAvailability } {
  return { value, availability };
}

export async function getInvestorMetrics(
  rawInput: z.infer<typeof inputSchema>,
): Promise<InvestorMetrics> {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid investor metrics input.", parsed.error.flatten());
  }
  assertPlatformAdminAccess({ actorUserId: parsed.data.actorUserId });

  const db = getDb();
  const month = currentMonthRangeUtc();

  const [activeOrgCount] = await db
    .select({ total: count() })
    .from(organizations)
    .where(eq(organizations.status, "active"));

  const [activeStoreCount] = await db
    .select({ total: count() })
    .from(stores)
    .where(eq(stores.status, "active"));

  const [monthlyCloseouts] = await db
    .select({ total: count() })
    .from(dailyCloseouts)
    .where(
      and(
        gte(dailyCloseouts.date, month.start),
        lte(dailyCloseouts.date, month.end),
      ),
    );

  const [monthlyOperations] = await db
    .select({ total: count() })
    .from(entries)
    .where(
      and(
        eq(entries.status, "active"),
        gte(entries.date, month.start),
        lte(entries.date, month.end),
      ),
    );

  const storeTotal = Number(activeStoreCount?.total || 0);
  const closeoutTotal = Number(monthlyCloseouts?.total || 0);
  const avgCloseoutsPerStore = storeTotal > 0
    ? Number((closeoutTotal / storeTotal).toFixed(2))
    : null;

  const [attachmentCount] = await db.select({ total: count() }).from(attachments);
  const attachmentsPerCloseout = closeoutTotal > 0
    ? Number((Number(attachmentCount?.total || 0) / closeoutTotal).toFixed(2))
    : null;

  const activeSubscriptions = await db
    .select({
      planCode: subscriptions.planCode,
      status: subscriptions.status,
    })
    .from(subscriptions)
    .where(eq(subscriptions.status, "active"));

  const estimatedMrrHalalas = activeSubscriptions.reduce(
    (sum, row) => sum + resolvePlanMrrHalalas(row.planCode),
    0,
  );
  const hasPaidSubscriptions = activeSubscriptions.length > 0;
  const estimatedMrrValue = hasPaidSubscriptions ? halalasToRiyals(estimatedMrrHalalas) : null;
  const estimatedArrValue = estimatedMrrValue !== null ? Number((estimatedMrrValue * 12).toFixed(2)) : null;

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

  let growthRate: number | null = null;
  let growthAvailability: MetricAvailability = "unavailable";
  if (latestMetrics && previousMetrics) {
    const current = Number(latestMetrics.activeOrganizationsCount || 0);
    const previous = Number(previousMetrics.activeOrganizationsCount || 0);
    if (previous > 0) {
      growthRate = Number((((current - previous) / previous) * 100).toFixed(2));
      growthAvailability = "available";
    }
  }

  const [latestSnapshot] = await db
    .select({ snapshotDate: orgEngagementSnapshots.snapshotDate })
    .from(orgEngagementSnapshots)
    .orderBy(desc(orgEngagementSnapshots.snapshotDate))
    .limit(1);

  let inactiveAccounts = 0;
  let retentionProxy: number | null = null;
  let retentionAvailability: MetricAvailability = "unavailable";
  let usageIntensity: number | null = null;
  let usageIntensityAvailability: MetricAvailability = "unavailable";

  if (latestSnapshot?.snapshotDate) {
    const snapshotRows = await db
      .select({
        engagementSegment: orgEngagementSnapshots.engagementSegment,
        activeDaysL30: orgEngagementSnapshots.activeDaysL30,
      })
      .from(orgEngagementSnapshots)
      .where(eq(orgEngagementSnapshots.snapshotDate, latestSnapshot.snapshotDate));

    const total = snapshotRows.length;
    inactiveAccounts = snapshotRows.filter(
      (row) => row.engagementSegment === "dormant" || row.engagementSegment === "churned",
    ).length;

    const activeCount = snapshotRows.filter((row) => row.activeDaysL30 > 0).length;
    if (total > 0) {
      retentionProxy = Number(((activeCount / total) * 100).toFixed(2));
      retentionAvailability = "estimated";
      usageIntensity = Number((activeCount / total).toFixed(2));
      usageIntensityAvailability = "estimated";
    }
  }

  const aggregatedMrr = latestMetrics ? halalasToRiyals(Number(latestMetrics.mrrHalalas || 0)) : null;
  const useAggregatedMrr = aggregatedMrr !== null && aggregatedMrr > 0;

  return {
    activeAccounts: Number(activeOrgCount?.total || 0),
    activeStores: storeTotal,
    monthlyCloseouts: closeoutTotal,
    monthlyOperations: Number(monthlyOperations?.total || 0),
    avgCloseoutsPerStore,
    attachmentsPerCloseout,
    estimatedMrr: {
      value: useAggregatedMrr ? aggregatedMrr : estimatedMrrValue,
      availability: useAggregatedMrr || hasPaidSubscriptions ? "estimated" : "unavailable",
      label: "Estimated MRR",
    },
    estimatedArr: {
      value: useAggregatedMrr && aggregatedMrr !== null
        ? Number((aggregatedMrr * 12).toFixed(2))
        : estimatedArrValue,
      availability: useAggregatedMrr || hasPaidSubscriptions ? "estimated" : "unavailable",
      label: "Estimated ARR",
    },
    potentialMrr: {
      value: estimatedMrrValue,
      availability: hasPaidSubscriptions ? "estimated" : "unavailable",
      label: "Potential MRR",
    },
    growthRate: metric(growthRate, growthAvailability),
    inactiveAccounts,
    retentionProxy: metric(retentionProxy, retentionAvailability),
    usageIntensity: metric(usageIntensity, usageIntensityAvailability),
    currency: "SAR",
    disclaimer: "المؤشرات المالية (MRR/ARR) تقديرية بناءً على خطط الاشتراك — لا تعكس تحصيلًا فعليًا ما لم يُفعّل نظام الدفع.",
  };
}
