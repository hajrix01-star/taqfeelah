import { and, desc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { assertPlatformAdminAccess } from "@/core/auth/assert-platform-admin-access";
import { getDb } from "@/core/db/client";
import { orgEngagementSnapshots } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { halalasToRiyals } from "@/domain/saas-analytics/plan-pricing";

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  billingType: z.enum(["all", "trial", "paid", "free", "churned"]).default("all"),
  segment: z.enum(["all", "power", "regular", "intermittent", "dormant", "churned"]).default("all"),
  limit: z.number().int().min(1).max(200).default(50),
});

export async function listSaasOrganizationAnalytics(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid SaaS organization analytics input.", parsed.error.flatten());
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

  if (!latestSnapshot?.snapshotDate) {
    return { asOf: null, organizations: [] };
  }

  const rows = await db
    .select()
    .from(orgEngagementSnapshots)
    .where(eq(orgEngagementSnapshots.snapshotDate, latestSnapshot.snapshotDate))
    .orderBy(desc(orgEngagementSnapshots.activeDaysL30), desc(orgEngagementSnapshots.tenureDays))
    .limit(input.limit);

  const organizations = rows
    .filter((row) => (input.billingType === "all" ? true : row.billingType === input.billingType))
    .filter((row) => (input.segment === "all" ? true : row.engagementSegment === input.segment))
    .map((row) => ({
      id: row.organizationId,
      name: row.organizationName,
      status: row.organizationStatus,
      billingType: row.billingType,
      subscriptionStatus: row.subscriptionStatus,
      planCode: row.planCode,
      tenureDays: row.tenureDays,
      engagementSegment: row.engagementSegment,
      activeDaysL30: row.activeDaysL30,
      activeUsersL30: row.activeUsersL30,
      closeoutsL30: row.closeoutsL30,
      entriesL30: row.entriesL30,
      operationalGmvL30: halalasToRiyals(Number(row.salesHalalasL30 || 0)),
      storesCount: row.storesCount,
      lastCoreActivityAt: row.lastCoreActivityAt?.toISOString() || null,
      daysSinceLastCoreActivity: row.daysSinceLastCoreActivity,
    }));

  return {
    asOf: latestSnapshot.snapshotDate,
    organizations,
  };
}
