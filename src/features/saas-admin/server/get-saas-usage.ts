import { and, count, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { assertPlatformAdminAccess } from "@/core/auth/assert-platform-admin-access";
import { getDb } from "@/core/db/client";
import {
  attachments,
  dailyCloseouts,
  entries,
  organizations,
  stores,
} from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import type { SaasUsageReport } from "@/features/saas-admin/types";
import {
  buildEngagementAccountLists,
  getPlatformSnapshot,
  loadOwnerNamesByOrgId,
} from "@/features/saas-admin/server/platform-metrics";

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
  months: z.number().int().min(1).max(12).default(6),
});

export async function getSaasUsage(rawInput: z.infer<typeof inputSchema>): Promise<SaasUsageReport> {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid SaaS usage input.", parsed.error.flatten());
  }
  assertPlatformAdminAccess({ actorUserId: parsed.data.actorUserId });

  const db = getDb();
  const monthsBack = parsed.data.months;
  const snapshot = await getPlatformSnapshot();

  const closeoutsByMonth = await db
    .select({
      month: sql<string>`to_char(${dailyCloseouts.date}, 'YYYY-MM')`,
      total: count(),
    })
    .from(dailyCloseouts)
    .where(gte(dailyCloseouts.date, sql`(current_date - make_interval(months => ${monthsBack}))::date`))
    .groupBy(sql`to_char(${dailyCloseouts.date}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${dailyCloseouts.date}, 'YYYY-MM')`);

  const operationsByMonth = await db
    .select({
      month: sql<string>`to_char(${entries.date}, 'YYYY-MM')`,
      total: count(),
    })
    .from(entries)
    .where(
      and(
        eq(entries.status, "active"),
        gte(entries.date, sql`(current_date - make_interval(months => ${monthsBack}))::date`),
      ),
    )
    .groupBy(sql`to_char(${entries.date}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${entries.date}, 'YYYY-MM')`);

  const attachmentsByMonth = await db
    .select({
      month: sql<string>`to_char(${attachments.createdAt}, 'YYYY-MM')`,
      total: count(),
    })
    .from(attachments)
    .where(gte(attachments.createdAt, sql`(current_date - make_interval(months => ${monthsBack}))`))
    .groupBy(sql`to_char(${attachments.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${attachments.createdAt}, 'YYYY-MM')`);

  const closeoutMap = new Map(closeoutsByMonth.map((row) => [row.month, Number(row.total)]));
  const operationMap = new Map(operationsByMonth.map((row) => [row.month, Number(row.total)]));
  const attachmentMap = new Map(attachmentsByMonth.map((row) => [row.month, Number(row.total)]));

  const allMonths = new Set([
    ...closeoutMap.keys(),
    ...operationMap.keys(),
    ...attachmentMap.keys(),
  ]);

  const monthlyTrend = [...allMonths].sort().map((month) => ({
    month,
    closeouts: closeoutMap.get(month) ?? 0,
    operations: operationMap.get(month) ?? 0,
    attachments: attachmentMap.get(month) ?? 0,
  }));

  const [storeCount] = await db.select({ total: count() }).from(stores);
  const [orgCount] = await db.select({ total: count() }).from(organizations);
  const totalCloseouts = closeoutsByMonth.reduce((sum, row) => sum + Number(row.total), 0);
  const totalOperations = operationsByMonth.reduce((sum, row) => sum + Number(row.total), 0);

  const avgCloseoutsPerStore = Number(storeCount?.total) > 0
    ? Number((totalCloseouts / Number(storeCount.total)).toFixed(2))
    : null;
  const avgOperationsPerAccount = Number(orgCount?.total) > 0
    ? Number((totalOperations / Number(orgCount.total)).toFixed(2))
    : null;

  const orgIds = snapshot.engagement.snapshotRows.map((row) => row.organizationId);
  const ownerByOrg = await loadOwnerNamesByOrgId(orgIds);
  const engagementLists = buildEngagementAccountLists(
    snapshot.engagement.snapshotRows,
    ownerByOrg,
    { topLimit: 10, inactiveLimit: 10 },
  );

  return {
    monthlyTrend,
    monthlyTrendSource: "live",
    avgCloseoutsPerStore: { value: avgCloseoutsPerStore, source: "live" },
    avgOperationsPerAccount: { value: avgOperationsPerAccount, source: "live" },
    topActiveAccounts: engagementLists.topActiveAccounts,
    inactiveAccounts: engagementLists.inactiveAccounts,
    lastActivityByAccount: engagementLists.lastActivityByAccount,
  };
}
