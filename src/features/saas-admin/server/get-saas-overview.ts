import { sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { organizations } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import type { SaasOverview } from "@/features/saas-admin/types";
import {
  buildEngagementAccountLists,
  getPlatformSnapshot,
  loadOwnerNamesByOrgId,
} from "@/features/saas-admin/server/platform-metrics";

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
});

export async function getSaasOverview(rawInput: z.infer<typeof inputSchema>): Promise<SaasOverview> {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid SaaS overview input.", parsed.error.flatten());
  }
  const snapshot = await getPlatformSnapshot();
  const orgIds = snapshot.engagement.snapshotRows.map((row) => row.organizationId);
  const ownerByOrg = await loadOwnerNamesByOrgId(orgIds);
  const engagementLists = buildEngagementAccountLists(
    snapshot.engagement.snapshotRows,
    ownerByOrg,
    { topLimit: 5, inactiveLimit: 5 },
  );

  let databaseStatus: SaasOverview["systemHealth"]["database"] = "healthy";
  try {
    const db = getDb();
    await db.select({ one: sql<number>`1` }).from(organizations).limit(1);
  } catch {
    databaseStatus = "unhealthy";
  }

  return {
    engagement: {
      snapshotDate: snapshot.engagement.snapshotDate,
      dataAvailable: snapshot.engagement.dataAvailable,
    },
    kpis: {
      totalAccounts: snapshot.totalAccounts,
      activeAccounts: snapshot.activeAccounts,
      storesCount: snapshot.storesCount,
      usersCount: snapshot.usersCount,
      closeoutsThisMonth: snapshot.closeoutsThisMonth,
      operationsThisMonth: snapshot.operationsThisMonth,
      attachmentsCount: snapshot.attachmentsCount,
      lastActivityAt: snapshot.lastActivityAt,
    },
    activityTrend: snapshot.activityTrend30d,
    activityTrendSource: snapshot.activityTrendSource,
    topActiveAccounts: engagementLists.topActiveAccounts,
    inactiveAccounts: engagementLists.inactiveAccounts,
    systemHealth: {
      database: databaseStatus,
      api: "healthy",
    },
  };
}
