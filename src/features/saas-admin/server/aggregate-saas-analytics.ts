import { and, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { getDb } from "@/core/db/client";
import {
  dailyCloseouts,
  dailyOrgMetrics,
  dailySaasMetrics,
  entries,
  invoices,
  orgEngagementSnapshots,
  organizations,
  paymentEvents,
  stores,
  subscriptions,
  usageEvents,
} from "@/core/db/schema";
import {
  CORE_USAGE_EVENT_NAMES,
  diffDaysUtc,
  resolveEngagementSegment,
  resolveSubscriberBillingType,
  subtractDaysUtc,
} from "@/domain/saas-analytics/engagement-segments";
import { resolvePlanMrrHalalas } from "@/domain/saas-analytics/plan-pricing";

type OrgActivityRow = {
  organizationId: string;
  activeDaysL30: number;
  activeUsersL30: number;
  closeoutsL30: number;
  entriesL30: number;
  salesHalalasL30: number;
  lastCoreActivityAt: Date | null;
};

function isoDateOnly(input: Date | string): string {
  if (typeof input === "string") return input.slice(0, 10);
  return input.toISOString().slice(0, 10);
}

async function loadUsageActivity(
  db: ReturnType<typeof getDb>,
  snapshotDate: string,
  windowStart: string,
): Promise<Map<string, OrgActivityRow>> {
  const rows = await db
    .select({
      organizationId: usageEvents.organizationId,
      activeDaysL30: sql<number>`count(distinct ${usageEvents.eventDate})`,
      activeUsersL30: sql<number>`count(distinct ${usageEvents.userId})`,
      closeoutsL30: sql<number>`count(*) filter (where ${usageEvents.eventName} = 'closeout_submitted')`,
      entriesL30: sql<number>`count(*) filter (where ${usageEvents.eventName} = 'entry_created')`,
      lastCoreActivityAt: sql<Date | null>`max(${usageEvents.eventAt})`,
    })
    .from(usageEvents)
    .where(
      and(
        inArray(usageEvents.eventName, [...CORE_USAGE_EVENT_NAMES]),
        gte(usageEvents.eventDate, windowStart),
        lte(usageEvents.eventDate, snapshotDate),
      ),
    )
    .groupBy(usageEvents.organizationId);

  const map = new Map<string, OrgActivityRow>();
  for (const row of rows) {
    map.set(row.organizationId, {
      organizationId: row.organizationId,
      activeDaysL30: Number(row.activeDaysL30 || 0),
      activeUsersL30: Number(row.activeUsersL30 || 0),
      closeoutsL30: Number(row.closeoutsL30 || 0),
      entriesL30: Number(row.entriesL30 || 0),
      salesHalalasL30: 0,
      lastCoreActivityAt: row.lastCoreActivityAt,
    });
  }
  return map;
}

type MutableOrgActivity = OrgActivityRow & {
  activeDaySet: Set<string>;
  activeUserSet: Set<string>;
};

function ensureMutableActivity(
  activityByOrg: Map<string, OrgActivityRow>,
  organizationId: string,
): MutableOrgActivity {
  const existing = activityByOrg.get(organizationId);
  if (existing && "activeDaySet" in existing) {
    return existing as MutableOrgActivity;
  }
  const next: MutableOrgActivity = {
    organizationId,
    activeDaysL30: existing?.activeDaysL30 || 0,
    activeUsersL30: existing?.activeUsersL30 || 0,
    closeoutsL30: existing?.closeoutsL30 || 0,
    entriesL30: existing?.entriesL30 || 0,
    salesHalalasL30: existing?.salesHalalasL30 || 0,
    lastCoreActivityAt: existing?.lastCoreActivityAt || null,
    activeDaySet: new Set<string>(),
    activeUserSet: new Set<string>(),
  };
  activityByOrg.set(organizationId, next);
  return next;
}

async function mergeOperationalFallback(
  db: ReturnType<typeof getDb>,
  snapshotDate: string,
  windowStart: string,
  activityByOrg: Map<string, OrgActivityRow>,
): Promise<void> {
  const entryRows = await db
    .select({
      organizationId: entries.organizationId,
      eventDate: entries.date,
      userId: entries.enteredByUserId,
      amountHalalas: entries.amountHalalas,
      type: entries.type,
    })
    .from(entries)
    .where(
      and(
        eq(entries.status, "active"),
        gte(entries.date, windowStart),
        lte(entries.date, snapshotDate),
      ),
    );

  const closeoutRows = await db
    .select({
      organizationId: dailyCloseouts.organizationId,
      eventDate: dailyCloseouts.date,
      actorUserId: dailyCloseouts.submittedByUserId,
    })
    .from(dailyCloseouts)
    .where(
      and(
        eq(dailyCloseouts.status, "approved"),
        gte(dailyCloseouts.date, windowStart),
        lte(dailyCloseouts.date, snapshotDate),
      ),
    );

  const touch = (
    organizationId: string,
    eventDate: string,
    userId: string | null,
    patch: Partial<Pick<OrgActivityRow, "closeoutsL30" | "entriesL30" | "salesHalalasL30">>,
  ) => {
    const existing = ensureMutableActivity(activityByOrg, organizationId);
    existing.activeDaySet.add(eventDate);
    if (userId) existing.activeUserSet.add(userId);
    existing.closeoutsL30 += patch.closeoutsL30 || 0;
    existing.entriesL30 += patch.entriesL30 || 0;
    existing.salesHalalasL30 += patch.salesHalalasL30 || 0;
    const eventAt = new Date(`${eventDate}T12:00:00.000Z`);
    if (!existing.lastCoreActivityAt || eventAt > existing.lastCoreActivityAt) {
      existing.lastCoreActivityAt = eventAt;
    }
  };

  for (const row of entryRows) {
    touch(row.organizationId, row.eventDate, row.userId, {
      entriesL30: 1,
      salesHalalasL30: row.type === "summary" ? Number(row.amountHalalas || 0) : 0,
    });
  }

  for (const row of closeoutRows) {
    touch(row.organizationId, row.eventDate, row.actorUserId, { closeoutsL30: 1 });
  }

  for (const [organizationId, row] of activityByOrg) {
    if (!("activeDaySet" in row)) continue;
    const mutable = row as MutableOrgActivity;
    if (mutable.activeDaySet.size > 0) {
      mutable.activeDaysL30 = Math.max(mutable.activeDaysL30, mutable.activeDaySet.size);
    }
    if (mutable.activeUserSet.size > 0) {
      mutable.activeUsersL30 = Math.max(mutable.activeUsersL30, mutable.activeUserSet.size);
    }
    const finalized: OrgActivityRow = {
      organizationId: mutable.organizationId,
      activeDaysL30: mutable.activeDaysL30,
      activeUsersL30: mutable.activeUsersL30,
      closeoutsL30: mutable.closeoutsL30,
      entriesL30: mutable.entriesL30,
      salesHalalasL30: mutable.salesHalalasL30,
      lastCoreActivityAt: mutable.lastCoreActivityAt,
    };
    activityByOrg.set(organizationId, finalized);
  }
}

async function loadSalesHalalasFromUsage(
  db: ReturnType<typeof getDb>,
  snapshotDate: string,
  windowStart: string,
): Promise<Map<string, number>> {
  const rows = await db
    .select({
      organizationId: entries.organizationId,
      salesHalalas: sql<number>`coalesce(sum(${entries.amountHalalas}), 0)`,
    })
    .from(entries)
    .where(
      and(
        eq(entries.status, "active"),
        eq(entries.type, "summary"),
        gte(entries.date, windowStart),
        lte(entries.date, snapshotDate),
      ),
    )
    .groupBy(entries.organizationId);

  return new Map(rows.map((row) => [row.organizationId, Number(row.salesHalalas || 0)]));
}

export async function aggregateSaasAnalytics(snapshotDateInput?: string) {
  const db = getDb();
  const snapshotDate = snapshotDateInput || isoDateOnly(new Date());
  const windowStart = subtractDaysUtc(snapshotDate, 29);

  const orgRows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      status: organizations.status,
      createdAt: organizations.createdAt,
    })
    .from(organizations);

  const subscriptionRows = await db
    .select({
      organizationId: subscriptions.organizationId,
      status: subscriptions.status,
      planCode: subscriptions.planCode,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
    })
    .from(subscriptions)
    .orderBy(desc(subscriptions.updatedAt));

  const subscriptionByOrg = new Map<string, (typeof subscriptionRows)[number]>();
  for (const row of subscriptionRows) {
    if (!subscriptionByOrg.has(row.organizationId)) {
      subscriptionByOrg.set(row.organizationId, row);
    }
  }

  const storeCounts = await db
    .select({
      organizationId: stores.organizationId,
      total: count(),
    })
    .from(stores)
    .where(eq(stores.status, "active"))
    .groupBy(stores.organizationId);
  const storesByOrg = new Map(storeCounts.map((row) => [row.organizationId, Number(row.total || 0)]));

  const activityByOrg = await loadUsageActivity(db, snapshotDate, windowStart);
  await mergeOperationalFallback(db, snapshotDate, windowStart, activityByOrg);
  const salesByOrg = await loadSalesHalalasFromUsage(db, snapshotDate, windowStart);

  for (const [organizationId, activity] of activityByOrg) {
    const sales = salesByOrg.get(organizationId);
    if (typeof sales === "number" && activity.salesHalalasL30 === 0) {
      activity.salesHalalasL30 = sales;
    }
  }

  const dayEntryRows = await db
    .select({
      organizationId: entries.organizationId,
      entriesCount: sql<number>`count(*)`,
      salesHalalas: sql<number>`coalesce(sum(case when ${entries.type} = 'summary' then ${entries.amountHalalas} else 0 end), 0)`,
      outflowHalalas: sql<number>`coalesce(sum(case when ${entries.type} <> 'summary' then ${entries.amountHalalas} else 0 end), 0)`,
      activeUsers: sql<number>`count(distinct ${entries.enteredByUserId})`,
    })
    .from(entries)
    .where(and(eq(entries.status, "active"), eq(entries.date, snapshotDate)))
    .groupBy(entries.organizationId);

  const dayCloseoutRows = await db
    .select({
      organizationId: dailyCloseouts.organizationId,
      closeoutsCount: count(),
    })
    .from(dailyCloseouts)
    .where(and(
      eq(dailyCloseouts.status, "approved"),
      eq(dailyCloseouts.date, snapshotDate),
    ))
    .groupBy(dailyCloseouts.organizationId);

  const closeoutsByOrg = new Map(dayCloseoutRows.map((row) => [
    row.organizationId,
    Number(row.closeoutsCount || 0),
  ]));

  let activeOrganizationsCount = 0;
  let mrrHalalas = 0;
  const snapshotValues: Array<typeof orgEngagementSnapshots.$inferInsert> = [];

  for (const org of orgRows) {
    const subscription = subscriptionByOrg.get(org.id);
    const activity = activityByOrg.get(org.id) || {
      organizationId: org.id,
      activeDaysL30: 0,
      activeUsersL30: 0,
      closeoutsL30: 0,
      entriesL30: 0,
      salesHalalasL30: salesByOrg.get(org.id) || 0,
      lastCoreActivityAt: null,
    };

    const lastCoreActivityAt = activity.lastCoreActivityAt;
    const daysSinceLastCoreActivity = lastCoreActivityAt
      ? diffDaysUtc(isoDateOnly(lastCoreActivityAt), snapshotDate)
      : null;

    const engagementSegment = resolveEngagementSegment({
      activeDaysL30: activity.activeDaysL30,
      organizationStatus: org.status,
      subscriptionStatus: subscription?.status || null,
      daysSinceLastCoreActivity,
    });

    const billingType = resolveSubscriberBillingType(subscription?.status || null);
    if (activity.activeDaysL30 > 0) activeOrganizationsCount += 1;

    if (subscription && (subscription.status === "active" || subscription.status === "past_due" || subscription.status === "trialing")) {
      mrrHalalas += resolvePlanMrrHalalas(subscription.planCode);
    }

    snapshotValues.push({
      snapshotDate,
      organizationId: org.id,
      organizationName: org.name,
      organizationStatus: org.status,
      subscriptionStatus: subscription?.status || null,
      billingType,
      planCode: subscription?.planCode || null,
      tenureDays: diffDaysUtc(isoDateOnly(org.createdAt), snapshotDate),
      activeDaysL30: activity.activeDaysL30,
      activeUsersL30: activity.activeUsersL30,
      closeoutsL30: activity.closeoutsL30,
      entriesL30: activity.entriesL30,
      salesHalalasL30: activity.salesHalalasL30,
      engagementSegment,
      lastCoreActivityAt,
      daysSinceLastCoreActivity,
      storesCount: storesByOrg.get(org.id) || 0,
    });
  }

  await db.delete(orgEngagementSnapshots).where(eq(orgEngagementSnapshots.snapshotDate, snapshotDate));
  if (snapshotValues.length > 0) {
    await db.insert(orgEngagementSnapshots).values(snapshotValues);
  }

  for (const row of dayEntryRows) {
    const salesHalalas = Number(row.salesHalalas || 0);
    const outflowHalalas = Number(row.outflowHalalas || 0);
    await db
      .insert(dailyOrgMetrics)
      .values({
        organizationId: row.organizationId,
        metricDate: snapshotDate,
        dauUsersCount: Number(row.activeUsers || 0),
        entriesCount: Number(row.entriesCount || 0),
        closeoutsSubmittedCount: closeoutsByOrg.get(row.organizationId) || 0,
        salesHalalas,
        outflowHalalas,
        netHalalas: salesHalalas - outflowHalalas,
      })
      .onConflictDoUpdate({
        target: [dailyOrgMetrics.organizationId, dailyOrgMetrics.metricDate],
        set: {
          dauUsersCount: Number(row.activeUsers || 0),
          entriesCount: Number(row.entriesCount || 0),
          closeoutsSubmittedCount: closeoutsByOrg.get(row.organizationId) || 0,
          salesHalalas,
          outflowHalalas,
          netHalalas: salesHalalas - outflowHalalas,
          updatedAt: new Date(),
        },
      });
  }

  const newOrganizationsCount = orgRows.filter(
    (org) => isoDateOnly(org.createdAt) === snapshotDate,
  ).length;

  const churnedOrganizationsCount = snapshotValues.filter(
    (row) => row.engagementSegment === "churned" || row.billingType === "churned",
  ).length;

  const dayStart = new Date(`${snapshotDate}T00:00:00.000Z`);
  const dayEnd = new Date(`${snapshotDate}T23:59:59.999Z`);
  const [collectionsRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${invoices.amountHalalas}), 0)`,
    })
    .from(invoices)
    .where(and(eq(invoices.status, "paid"), gte(invoices.paidAt, dayStart), lte(invoices.paidAt, dayEnd)));

  const [failedPaymentsRow] = await db
    .select({ total: count() })
    .from(paymentEvents)
    .where(
      and(
        eq(paymentEvents.eventType, "payment_failed"),
        gte(paymentEvents.occurredAt, dayStart),
        lte(paymentEvents.occurredAt, dayEnd),
      ),
    );

  await db
    .insert(dailySaasMetrics)
    .values({
      metricDate: snapshotDate,
      activeOrganizationsCount,
      newOrganizationsCount,
      churnedOrganizationsCount,
      mrrHalalas,
      arrHalalas: mrrHalalas * 12,
      collectionsHalalas: Number(collectionsRow?.total || 0),
      failedPaymentsCount: Number(failedPaymentsRow?.total || 0),
    })
    .onConflictDoUpdate({
      target: dailySaasMetrics.metricDate,
      set: {
        activeOrganizationsCount,
        newOrganizationsCount,
        churnedOrganizationsCount,
        mrrHalalas,
        arrHalalas: mrrHalalas * 12,
        collectionsHalalas: Number(collectionsRow?.total || 0),
        failedPaymentsCount: Number(failedPaymentsRow?.total || 0),
        updatedAt: new Date(),
      },
    });

  return {
    snapshotDate,
    organizationsProcessed: orgRows.length,
    snapshotsWritten: snapshotValues.length,
    activeOrganizationsCount,
    mrrHalalas,
  };
}
