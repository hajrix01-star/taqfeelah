import { and, asc, count, desc, eq, gte, ilike, inArray, lte } from "drizzle-orm";
import { z } from "zod";
import { assertPlatformAdminAccess } from "@/core/auth/assert-platform-admin-access";
import { getDb } from "@/core/db/client";
import {
  dailyCloseouts,
  organizationMembers,
  organizations,
  orgEngagementSnapshots,
  stores,
  subscriptions,
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

export async function getSaasAccounts(rawInput: z.infer<typeof inputSchema>): Promise<SaasAccountsList> {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid SaaS accounts input.", parsed.error.flatten());
  }
  const input = parsed.data;
  assertPlatformAdminAccess({ actorUserId: input.actorUserId });

  const db = getDb();
  const month = currentMonthRangeUtc();
  const offset = (input.page - 1) * input.pageSize;

  const searchFilter = input.search?.trim()
    ? ilike(organizations.name, `%${input.search.trim()}%`)
    : undefined;

  const orgWhere = searchFilter ? and(searchFilter) : undefined;

  const [totalRow] = await db
    .select({ total: count() })
    .from(organizations)
    .where(orgWhere);

  const orgRows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      status: organizations.status,
      createdAt: organizations.createdAt,
      updatedAt: organizations.updatedAt,
    })
    .from(organizations)
    .where(orgWhere)
    .orderBy(desc(organizations.updatedAt), asc(organizations.name))
    .limit(input.pageSize)
    .offset(offset);

  const orgIds = orgRows.map((row) => row.id);

  const subscriptionRows = orgIds.length
    ? await db
      .select({
        organizationId: subscriptions.organizationId,
        planCode: subscriptions.planCode,
        status: subscriptions.status,
      })
      .from(subscriptions)
      .where(inArray(subscriptions.organizationId, orgIds))
      .orderBy(desc(subscriptions.updatedAt))
    : [];

  const subscriptionByOrg = new Map<string, (typeof subscriptionRows)[number]>();
  for (const row of subscriptionRows) {
    if (!subscriptionByOrg.has(row.organizationId)) {
      subscriptionByOrg.set(row.organizationId, row);
    }
  }

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

  let accounts = orgRows.map((row) => {
    const subscription = subscriptionByOrg.get(row.id);
    const accountStatus = resolveAccountStatus({
      organizationStatus: row.status,
      subscriptionStatus: subscription?.status,
    });
    return {
      id: row.id,
      name: row.name,
      ownerName: ownerByOrg.get(row.id) ?? null,
      storesCount: storeCountByOrg.get(row.id) ?? 0,
      usersCount: userCountByOrg.get(row.id) ?? 0,
      closeoutsThisMonth: closeoutCountByOrg.get(row.id) ?? 0,
      lastActivityAt: lastActivityByOrg.get(row.id) ?? row.updatedAt.toISOString(),
      planCode: subscription?.planCode ?? null,
      status: accountStatus,
      createdAt: row.createdAt.toISOString(),
    };
  });

  if (input.status !== "all") {
    accounts = accounts.filter((row) => row.status === input.status);
  }

  if (input.plan?.trim()) {
    const planFilter = input.plan.trim().toLowerCase();
    accounts = accounts.filter((row) => (row.planCode ?? "").toLowerCase() === planFilter);
  }

  return {
    accounts,
    total: Number(totalRow?.total || 0),
    page: input.page,
    pageSize: input.pageSize,
  };
}
