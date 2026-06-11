import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/core/db/client";
import { organizationMembers, users } from "@/core/db/schema";
import type { AccountActivitySummary } from "@/features/saas-admin/types";
import { resolveAccountStatus } from "@/features/saas-admin/server/saas-admin-utils";
import type { EngagementSnapshotRow } from "@/features/saas-admin/server/platform-metrics/types";

export async function loadOwnerNamesByOrgId(
  orgIds: string[],
): Promise<Map<string, string>> {
  if (!orgIds.length) return new Map();

  const db = getDb();
  const ownerRows = await db
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
    );

  return new Map(ownerRows.map((row) => [row.organizationId, row.ownerName]));
}

export function mapSnapshotRowToAccountSummary(
  row: EngagementSnapshotRow,
  ownerByOrg: Map<string, string>,
): AccountActivitySummary {
  return {
    id: row.organizationId,
    name: row.organizationName,
    ownerName: ownerByOrg.get(row.organizationId) ?? null,
    closeoutsThisMonth: row.closeoutsL30,
    lastActivityAt: row.lastCoreActivityAt?.toISOString() ?? null,
    status: resolveAccountStatus({
      organizationStatus: row.organizationStatus,
      subscriptionStatus: row.subscriptionStatus,
    }),
  };
}

export function buildEngagementAccountLists(
  rows: EngagementSnapshotRow[],
  ownerByOrg: Map<string, string>,
  options?: { topLimit?: number; inactiveLimit?: number },
): {
  topActiveAccounts: AccountActivitySummary[];
  inactiveAccounts: AccountActivitySummary[];
  lastActivityByAccount: Array<{
    id: string;
    name: string;
    lastActivityAt: string | null;
    daysSinceActivity: number | null;
  }>;
} {
  const topLimit = options?.topLimit ?? 10;
  const inactiveLimit = options?.inactiveLimit ?? 10;

  const topActiveAccounts = rows
    .filter((row) => row.closeoutsL30 > 0 || row.entriesL30 > 0)
    .slice(0, topLimit)
    .map((row) => mapSnapshotRowToAccountSummary(row, ownerByOrg));

  const inactiveAccounts = rows
    .filter((row) => row.engagementSegment === "dormant" || row.engagementSegment === "churned")
    .slice(0, inactiveLimit)
    .map((row) => mapSnapshotRowToAccountSummary(row, ownerByOrg));

  const lastActivityByAccount = rows.map((row) => ({
    id: row.organizationId,
    name: row.organizationName,
    lastActivityAt: row.lastCoreActivityAt?.toISOString() ?? null,
    daysSinceActivity: row.daysSinceLastCoreActivity,
  }));

  return { topActiveAccounts, inactiveAccounts, lastActivityByAccount };
}
