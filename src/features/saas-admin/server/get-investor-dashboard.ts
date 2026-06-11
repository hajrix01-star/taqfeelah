import { and, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { assertPlatformAdminAccess } from "@/core/auth/assert-platform-admin-access";
import { getDb } from "@/core/db/client";
import { dailySaasMetrics, orgEngagementSnapshots } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import {
  EngagementSegment,
  isPayingSubscriberBillingType,
  percentOfTotal,
  SubscriberBillingType,
} from "@/domain/saas-analytics/engagement-segments";
import { halalasToRiyals } from "@/domain/saas-analytics/plan-pricing";

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

type SegmentCounts = Record<EngagementSegment, { count: number; percent: number }>;
type BillingCounts = Record<SubscriberBillingType, { count: number; percent: number }>;

function buildSegmentCounts(rows: Array<{ engagementSegment: string }>, baseTotal: number): SegmentCounts {
  const counts: Record<EngagementSegment, number> = {
    power: 0,
    regular: 0,
    intermittent: 0,
    dormant: 0,
    churned: 0,
  };
  for (const row of rows) {
    const key = row.engagementSegment as EngagementSegment;
    if (key in counts) counts[key] += 1;
  }
  return {
    power: { count: counts.power, percent: percentOfTotal(counts.power, baseTotal) },
    regular: { count: counts.regular, percent: percentOfTotal(counts.regular, baseTotal) },
    intermittent: { count: counts.intermittent, percent: percentOfTotal(counts.intermittent, baseTotal) },
    dormant: { count: counts.dormant, percent: percentOfTotal(counts.dormant, baseTotal) },
    churned: { count: counts.churned, percent: percentOfTotal(counts.churned, baseTotal) },
  };
}

function buildBillingCounts(rows: Array<{ billingType: string }>, baseTotal: number): BillingCounts {
  const counts: Record<SubscriberBillingType, number> = {
    trial: 0,
    paid: 0,
    free: 0,
    churned: 0,
  };
  for (const row of rows) {
    const key = row.billingType as SubscriberBillingType;
    if (key in counts) counts[key] += 1;
  }
  return {
    trial: { count: counts.trial, percent: percentOfTotal(counts.trial, baseTotal) },
    paid: { count: counts.paid, percent: percentOfTotal(counts.paid, baseTotal) },
    free: { count: counts.free, percent: percentOfTotal(counts.free, baseTotal) },
    churned: { count: counts.churned, percent: percentOfTotal(counts.churned, baseTotal) },
  };
}

export async function getInvestorDashboard(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid investor dashboard input.", parsed.error.flatten());
  }
  const input = parsed.data;
  assertPlatformAdminAccess({ actorUserId: input.actorUserId });

  const db = getDb();
  const [latestSnapshot] = await db
    .select({ snapshotDate: orgEngagementSnapshots.snapshotDate })
    .from(orgEngagementSnapshots)
    .where(
      and(
        lte(orgEngagementSnapshots.snapshotDate, input.to),
        gte(orgEngagementSnapshots.snapshotDate, input.from),
      ),
    )
    .orderBy(desc(orgEngagementSnapshots.snapshotDate))
    .limit(1);

  const snapshotDate = latestSnapshot?.snapshotDate || null;
  const snapshotRows = snapshotDate
    ? await db
      .select()
      .from(orgEngagementSnapshots)
      .where(eq(orgEngagementSnapshots.snapshotDate, snapshotDate))
    : [];

  const subscriberRows = snapshotRows.filter((row) => isPayingSubscriberBillingType(
    row.billingType as SubscriberBillingType,
  ));
  const subscriberTotal = subscriberRows.length;
  const billing = buildBillingCounts(subscriberRows, subscriberTotal);

  const activeSubscriberRows = subscriberRows.filter((row) => row.activeDaysL30 > 0);
  const activeSubscribers = activeSubscriberRows.length;
  const segments = buildSegmentCounts(subscriberRows, subscriberTotal);
  const habitualCount = segments.power.count + segments.regular.count;

  const trendRows = await db
    .select()
    .from(dailySaasMetrics)
    .where(and(gte(dailySaasMetrics.metricDate, input.from), lte(dailySaasMetrics.metricDate, input.to)))
    .orderBy(dailySaasMetrics.metricDate);

  const latestMetrics = trendRows.at(-1);

  return {
    from: input.from,
    to: input.to,
    asOf: snapshotDate,
    subscribers: {
      total: subscriberTotal,
      trial: billing.trial,
      paid: billing.paid,
      activeWithCoreUsageL30: {
        count: activeSubscribers,
        percent: percentOfTotal(activeSubscribers, subscriberTotal),
      },
    },
    engagement: {
      segments,
      habitualUsers: {
        count: habitualCount,
        percent: percentOfTotal(habitualCount, subscriberTotal),
        definition: "power + regular (8+ active days in last 30)",
      },
      intermittentUsers: segments.intermittent,
      dormantSubscribers: segments.dormant,
    },
    revenue: {
      mrr: halalasToRiyals(Number(latestMetrics?.mrrHalalas || 0)),
      arr: halalasToRiyals(Number(latestMetrics?.arrHalalas || 0)),
      collectionsInRange: halalasToRiyals(
        trendRows.reduce((sum, row) => sum + Number(row.collectionsHalalas || 0), 0),
      ),
      failedPaymentsInRange: trendRows.reduce(
        (sum, row) => sum + Number(row.failedPaymentsCount || 0),
        0,
      ),
      currency: "SAR",
    },
    platform: {
      activeOrganizationsL30: Number(latestMetrics?.activeOrganizationsCount || 0),
      newOrganizationsInRange: trendRows.reduce(
        (sum, row) => sum + Number(row.newOrganizationsCount || 0),
        0,
      ),
      churnedSignalsInRange: trendRows.reduce(
        (sum, row) => sum + Number(row.churnedOrganizationsCount || 0),
        0,
      ),
    },
    trends: trendRows.map((row) => ({
      date: row.metricDate,
      activeOrganizations: row.activeOrganizationsCount,
      mrr: halalasToRiyals(Number(row.mrrHalalas || 0)),
      collections: halalasToRiyals(Number(row.collectionsHalalas || 0)),
      newOrganizations: row.newOrganizationsCount,
    })),
    methodology: {
      coreActiveEvents: ["closeout_submitted", "entry_created"],
      subscriberScope: "trial + paid subscriptions",
      segmentDaysWindow: 30,
    },
  };
}
