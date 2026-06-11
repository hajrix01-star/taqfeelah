import { and, count, desc, eq, gte, inArray, lte, max, sql } from "drizzle-orm";
import { z } from "zod";
import { assertPlatformAdminAccess } from "@/core/auth/assert-platform-admin-access";
import { getDb } from "@/core/db/client";
import {
  attachments,
  dailyCloseouts,
  dailyOrgMetrics,
  entries,
  organizationMembers,
  organizations,
  orgEngagementSnapshots,
  stores,
  users,
} from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import type { SaasOverview } from "@/features/saas-admin/types";
import {
  currentMonthRangeUtc,
  lastNDaysRangeUtc,
  resolveAccountStatus,
} from "@/features/saas-admin/server/saas-admin-utils";

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
});

export async function getSaasOverview(rawInput: z.infer<typeof inputSchema>): Promise<SaasOverview> {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid SaaS overview input.", parsed.error.flatten());
  }
  assertPlatformAdminAccess({ actorUserId: parsed.data.actorUserId });

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
  const [userCount] = await db
    .select({ total: count() })
    .from(organizationMembers)
    .where(eq(organizationMembers.status, "active"));

  const [closeoutsMonth] = await db
    .select({ total: count() })
    .from(dailyCloseouts)
    .where(
      and(
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
    .from(dailyCloseouts);
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

  let topActiveAccounts: SaasOverview["topActiveAccounts"] = [];
  let inactiveAccounts: SaasOverview["inactiveAccounts"] = [];

  if (latestSnapshot?.snapshotDate) {
    const snapshotRows = await db
      .select()
      .from(orgEngagementSnapshots)
      .where(eq(orgEngagementSnapshots.snapshotDate, latestSnapshot.snapshotDate))
      .orderBy(desc(orgEngagementSnapshots.closeoutsL30))
      .limit(200);

    const orgIds = snapshotRows.map((row) => row.organizationId);
    const ownerRows = orgIds.length
      ? await db
        .select({
          organizationId: organizationMembers.organizationId,
          ownerName: users.name,
        })
        .from(organizationMembers)
        .innerJoin(users, eq(organizationMembers.userId, users.id))
        .where(
          and(
            eq(organizationMembers.role, "owner"),
            eq(organizationMembers.status, "active"),
            inArray(organizationMembers.organizationId, orgIds),
          ),
        )
      : [];
    const ownerByOrg = new Map(ownerRows.map((row) => [row.organizationId, row.ownerName]));

    const mapRow = (row: (typeof snapshotRows)[number]): SaasOverview["topActiveAccounts"][number] => ({
      id: row.organizationId,
      name: row.organizationName,
      ownerName: ownerByOrg.get(row.organizationId) ?? null,
      closeoutsThisMonth: row.closeoutsL30,
      lastActivityAt: row.lastCoreActivityAt?.toISOString() ?? null,
      status: resolveAccountStatus({
        organizationStatus: row.organizationStatus,
        subscriptionStatus: row.subscriptionStatus,
      }),
    });

    topActiveAccounts = snapshotRows
      .filter((row) => row.closeoutsL30 > 0 || row.entriesL30 > 0)
      .slice(0, 5)
      .map(mapRow);

    inactiveAccounts = snapshotRows
      .filter((row) => row.engagementSegment === "dormant" || row.engagementSegment === "churned")
      .slice(0, 5)
      .map(mapRow);
  }

  let databaseStatus: SaasOverview["systemHealth"]["database"] = "healthy";
  try {
    await db.select({ one: sql<number>`1` }).from(organizations).limit(1);
  } catch {
    databaseStatus = "unhealthy";
  }

  return {
    kpis: {
      totalAccounts: Number(orgCounts?.total || 0),
      activeAccounts: Number(orgCounts?.active || 0),
      storesCount: Number(storeCount?.total || 0),
      usersCount: Number(userCount?.total || 0),
      closeoutsThisMonth: Number(closeoutsMonth?.total || 0),
      operationsThisMonth: Number(operationsMonth?.total || 0),
      attachmentsCount: Number(attachmentCount?.total || 0),
      lastActivityAt,
    },
    activityTrend: trendRows.map((row) => ({
      date: row.metricDate,
      closeouts: Number(row.closeouts),
      operations: Number(row.operations),
    })),
    topActiveAccounts,
    inactiveAccounts,
    systemHealth: {
      database: databaseStatus,
      api: "healthy",
    },
  };
}
