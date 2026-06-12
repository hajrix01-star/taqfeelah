import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import {
  dailyCloseouts,
  organizationMembers,
  organizations,
  orgEngagementSnapshots,
  stores,
  users,
} from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import type { SaasAccountsList } from "@/features/saas-admin/types";
import { currentMonthRangeUtc, resolveAccountStatus } from "@/features/saas-admin/server/saas-admin-utils";

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
  search: z.string().max(100).optional(),
  status: z.enum(["all", "trial", "active", "inactive", "suspended"]).default("all"),
  plan: z.string().max(50).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});

const latestSubscriptionSubquery = sql`
  (
    SELECT DISTINCT ON (organization_id)
      organization_id,
      plan_code,
      status AS sub_status
    FROM subscriptions
    ORDER BY organization_id, updated_at DESC
  ) AS latest_sub
`;

const accountStatusSql = sql<string>`CASE
  WHEN ${organizations.status} = 'suspended' THEN 'suspended'
  WHEN latest_sub.sub_status = 'trialing' THEN 'trial'
  WHEN latest_sub.sub_status = 'active' THEN 'active'
  ELSE 'inactive'
END`;

export async function getSaasAccounts(rawInput: z.infer<typeof inputSchema>): Promise<SaasAccountsList> {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid SaaS accounts input.", parsed.error.flatten());
  }
  const input = parsed.data;

  const db = getDb();
  const month = currentMonthRangeUtc();
  const offset = (input.page - 1) * input.pageSize;

  const filters = [];
  if (input.search?.trim()) {
    filters.push(ilike(organizations.name, `%${input.search.trim()}%`));
  }
  if (input.plan?.trim()) {
    filters.push(sql`lower(coalesce(latest_sub.plan_code, '')) = ${input.plan.trim().toLowerCase()}`);
  }
  if (input.status !== "all") {
    filters.push(sql`${accountStatusSql} = ${input.status}`);
  }
  const whereClause = filters.length ? and(...filters) : undefined;

  const [totalRow] = await db
    .select({ total: count() })
    .from(organizations)
    .leftJoin(latestSubscriptionSubquery, sql`${organizations.id} = latest_sub.organization_id`)
    .where(whereClause);

  const orgRows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      status: organizations.status,
      createdAt: organizations.createdAt,
      updatedAt: organizations.updatedAt,
      planCode: sql<string | null>`latest_sub.plan_code`,
      subStatus: sql<string | null>`latest_sub.sub_status`,
    })
    .from(organizations)
    .leftJoin(latestSubscriptionSubquery, sql`${organizations.id} = latest_sub.organization_id`)
    .where(whereClause)
    .orderBy(desc(organizations.updatedAt), asc(organizations.name))
    .limit(input.pageSize)
    .offset(offset);

  const orgIds = orgRows.map((row) => row.id);

  const storeCounts = orgIds.length
    ? await db
      .select({
        organizationId: stores.organizationId,
        total: count(),
      })
      .from(stores)
      .where(inArray(stores.organizationId, orgIds))
      .groupBy(stores.organizationId)
    : [];

  const userCounts = orgIds.length
    ? await db
      .select({
        organizationId: organizationMembers.organizationId,
        total: count(),
      })
      .from(organizationMembers)
      .where(
        and(
          inArray(organizationMembers.organizationId, orgIds),
          eq(organizationMembers.status, "active"),
        ),
      )
      .groupBy(organizationMembers.organizationId)
    : [];

  const closeoutCounts = orgIds.length
    ? await db
      .select({
        organizationId: dailyCloseouts.organizationId,
        total: count(),
      })
      .from(dailyCloseouts)
      .where(
        and(
          inArray(dailyCloseouts.organizationId, orgIds),
          gte(dailyCloseouts.date, month.start),
          lte(dailyCloseouts.date, month.end),
        ),
      )
      .groupBy(dailyCloseouts.organizationId)
    : [];

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
          inArray(organizationMembers.organizationId, orgIds),
          eq(organizationMembers.role, "owner"),
          eq(organizationMembers.status, "active"),
        ),
      )
    : [];

  const [latestSnapshot] = await db
    .select({ snapshotDate: orgEngagementSnapshots.snapshotDate })
    .from(orgEngagementSnapshots)
    .orderBy(desc(orgEngagementSnapshots.snapshotDate))
    .limit(1);

  const engagementRows = latestSnapshot?.snapshotDate && orgIds.length
    ? await db
      .select({
        organizationId: orgEngagementSnapshots.organizationId,
        lastCoreActivityAt: orgEngagementSnapshots.lastCoreActivityAt,
      })
      .from(orgEngagementSnapshots)
      .where(
        and(
          eq(orgEngagementSnapshots.snapshotDate, latestSnapshot.snapshotDate),
          inArray(orgEngagementSnapshots.organizationId, orgIds),
        ),
      )
    : [];

  const storeCountByOrg = new Map(storeCounts.map((row) => [row.organizationId, Number(row.total)]));
  const userCountByOrg = new Map(userCounts.map((row) => [row.organizationId, Number(row.total)]));
  const closeoutCountByOrg = new Map(closeoutCounts.map((row) => [row.organizationId, Number(row.total)]));
  const ownerByOrg = new Map(ownerRows.map((row) => [row.organizationId, row.ownerName]));
  const lastActivityByOrg = new Map(
    engagementRows.map((row) => [row.organizationId, row.lastCoreActivityAt?.toISOString() ?? null]),
  );

  const accounts = orgRows.map((row) => ({
    id: row.id,
    name: row.name,
    ownerName: ownerByOrg.get(row.id) ?? null,
    storesCount: storeCountByOrg.get(row.id) ?? 0,
    usersCount: userCountByOrg.get(row.id) ?? 0,
    closeoutsThisMonth: closeoutCountByOrg.get(row.id) ?? 0,
    lastActivityAt: lastActivityByOrg.get(row.id) ?? row.updatedAt.toISOString(),
    planCode: row.planCode ?? null,
    status: resolveAccountStatus({
      organizationStatus: row.status,
      subscriptionStatus: row.subStatus,
    }),
    createdAt: row.createdAt.toISOString(),
  }));

  return {
    accounts,
    total: Number(totalRow?.total || 0),
    page: input.page,
    pageSize: input.pageSize,
  };
}
