import { and, asc, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import {
  attachments,
  dailyCloseouts,
  entries,
  organizationMembers,
  organizations,
  orgEngagementSnapshots,
  stores,
  subscriptions,
  users,
} from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import type { SaasAccountDetails } from "@/features/saas-admin/types";
import { resolveOrganizationOwnerMember } from "@/features/saas-admin/server/resolve-organization-owner-member";
import { currentMonthRangeUtc, resolveAccountStatus } from "@/features/saas-admin/server/saas-admin-utils";

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
  organizationId: z.string().uuid(),
});

export async function getSaasAccountDetails(
  rawInput: z.infer<typeof inputSchema>,
): Promise<SaasAccountDetails> {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid SaaS account details input.", parsed.error.flatten());
  }
  const input = parsed.data;
  const db = getDb();
  const month = currentMonthRangeUtc();

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, input.organizationId))
    .limit(1);

  if (!org) {
    throw new ValidationError("Organization was not found.");
  }

  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.organizationId, input.organizationId))
    .orderBy(desc(subscriptions.updatedAt))
    .limit(1);

  const owner = await resolveOrganizationOwnerMember(input.organizationId, db);

  const storeRows = await db
    .select({
      id: stores.id,
      name: stores.name,
      status: stores.status,
      createdAt: stores.createdAt,
    })
    .from(stores)
    .where(eq(stores.organizationId, input.organizationId))
    .orderBy(asc(stores.name));

  const memberRows = await db
    .select({
      memberId: organizationMembers.id,
      userId: users.id,
      name: users.name,
      role: organizationMembers.role,
      status: organizationMembers.status,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(organizationMembers.userId, users.id))
    .where(eq(organizationMembers.organizationId, input.organizationId))
    .orderBy(asc(users.name));

  const [closeoutsMonth] = await db
    .select({ total: count() })
    .from(dailyCloseouts)
    .where(
      and(
        eq(dailyCloseouts.organizationId, input.organizationId),
        gte(dailyCloseouts.date, month.start),
        lte(dailyCloseouts.date, month.end),
      ),
    );

  const [operationsTotal] = await db
    .select({ total: count() })
    .from(entries)
    .where(
      and(
        eq(entries.organizationId, input.organizationId),
        eq(entries.status, "active"),
      ),
    );

  const [attachmentsTotal] = await db
    .select({ total: count() })
    .from(attachments)
    .where(eq(attachments.organizationId, input.organizationId));

  const recentCloseouts = await db
    .select({
      id: dailyCloseouts.id,
      storeName: stores.name,
      date: dailyCloseouts.date,
      status: dailyCloseouts.status,
      createdAt: dailyCloseouts.createdAt,
    })
    .from(dailyCloseouts)
    .innerJoin(stores, eq(dailyCloseouts.storeId, stores.id))
    .where(eq(dailyCloseouts.organizationId, input.organizationId))
    .orderBy(desc(dailyCloseouts.createdAt))
    .limit(10);

  const recentOperations = await db
    .select({
      id: entries.id,
      storeName: stores.name,
      type: entries.type,
      date: entries.date,
      createdAt: entries.createdAt,
    })
    .from(entries)
    .innerJoin(stores, eq(entries.storeId, stores.id))
    .where(
      and(
        eq(entries.organizationId, input.organizationId),
        eq(entries.status, "active"),
      ),
    )
    .orderBy(desc(entries.createdAt))
    .limit(10);

  const monthlyUsage = await db
    .select({
      month: sql<string>`to_char(${entries.date}, 'YYYY-MM')`,
      closeouts: sql<number>`0`,
      operations: count(),
      attachments: sql<number>`0`,
    })
    .from(entries)
    .where(
      and(
        eq(entries.organizationId, input.organizationId),
        eq(entries.status, "active"),
        gte(entries.date, sql`(current_date - interval '6 months')::date`),
      ),
    )
    .groupBy(sql`to_char(${entries.date}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${entries.date}, 'YYYY-MM')`);

  const closeoutsByMonth = await db
    .select({
      month: sql<string>`to_char(${dailyCloseouts.date}, 'YYYY-MM')`,
      total: count(),
    })
    .from(dailyCloseouts)
    .where(
      and(
        eq(dailyCloseouts.organizationId, input.organizationId),
        gte(dailyCloseouts.date, sql`(current_date - interval '6 months')::date`),
      ),
    )
    .groupBy(sql`to_char(${dailyCloseouts.date}, 'YYYY-MM')`);

  const attachmentsByMonth = await db
    .select({
      month: sql<string>`to_char(${attachments.createdAt}, 'YYYY-MM')`,
      total: count(),
    })
    .from(attachments)
    .where(
      and(
        eq(attachments.organizationId, input.organizationId),
        gte(attachments.createdAt, sql`(current_date - interval '6 months')`),
      ),
    )
    .groupBy(sql`to_char(${attachments.createdAt}, 'YYYY-MM')`);

  const closeoutMap = new Map(closeoutsByMonth.map((row) => [row.month, Number(row.total)]));
  const attachmentMap = new Map(attachmentsByMonth.map((row) => [row.month, Number(row.total)]));
  const operationMap = new Map(monthlyUsage.map((row) => [row.month, Number(row.operations)]));

  const allMonths = new Set([
    ...closeoutMap.keys(),
    ...attachmentMap.keys(),
    ...operationMap.keys(),
  ]);

  const mergedMonthlyUsage = [...allMonths].sort().map((monthKey) => ({
    month: monthKey,
    closeouts: closeoutMap.get(monthKey) ?? 0,
    operations: operationMap.get(monthKey) ?? 0,
    attachments: attachmentMap.get(monthKey) ?? 0,
  }));

  const attachmentRows = await db
    .select({
      id: attachments.id,
      storeName: stores.name,
      mimeType: attachments.mimeType,
      sizeBytes: attachments.sizeBytes,
      createdAt: attachments.createdAt,
    })
    .from(attachments)
    .innerJoin(stores, eq(attachments.storeId, stores.id))
    .where(eq(attachments.organizationId, input.organizationId))
    .orderBy(desc(attachments.createdAt))
    .limit(20);

  const [engagement] = await db
    .select({ lastCoreActivityAt: orgEngagementSnapshots.lastCoreActivityAt })
    .from(orgEngagementSnapshots)
    .where(eq(orgEngagementSnapshots.organizationId, input.organizationId))
    .orderBy(desc(orgEngagementSnapshots.snapshotDate))
    .limit(1);

  return {
    id: org.id,
    name: org.name,
    ownerName: owner?.name ?? null,
    ownerUsername: owner?.username ?? null,
    ownerPhone: owner?.loginPhone ?? null,
    ownerMemberId: owner?.memberId ?? null,
    status: resolveAccountStatus({
      organizationStatus: org.status,
      subscriptionStatus: subscription?.status,
    }),
    planCode: subscription?.planCode ?? null,
    createdAt: org.createdAt.toISOString(),
    lastActivityAt: engagement?.lastCoreActivityAt?.toISOString() ?? org.updatedAt.toISOString(),
    storesCount: storeRows.length,
    usersCount: memberRows.length,
    closeoutsThisMonth: Number(closeoutsMonth?.total || 0),
    operationsCount: Number(operationsTotal?.total || 0),
    attachmentsCount: Number(attachmentsTotal?.total || 0),
    stores: storeRows.map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    })),
    users: memberRows.map((row) => ({
      memberId: row.memberId,
      userId: row.userId,
      name: row.name,
      role: row.role,
      status: row.status,
    })),
    recentCloseouts: recentCloseouts.map((row) => ({
      id: row.id,
      storeName: row.storeName,
      date: row.date,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    })),
    recentOperations: recentOperations.map((row) => ({
      id: row.id,
      storeName: row.storeName,
      type: row.type,
      date: row.date,
      createdAt: row.createdAt.toISOString(),
    })),
    monthlyUsage: mergedMonthlyUsage,
    attachments: attachmentRows.map((row) => ({
      id: row.id,
      storeName: row.storeName,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}
