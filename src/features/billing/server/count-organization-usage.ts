import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/core/db/client";
import { memberInvitations, organizationMembers, stores } from "@/core/db/schema";
import type { OrganizationEntitlementUsage } from "@/features/billing/types";

export async function countOrganizationUsage(
  organizationId: string,
  executor?: Pick<ReturnType<typeof getDb>, "select">,
): Promise<OrganizationEntitlementUsage> {
  const db = executor ?? getDb();

  const [storeCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(stores)
    .where(
      and(eq(stores.organizationId, organizationId), eq(stores.status, "active")),
    );

  const [employeeCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.status, "active"),
        inArray(organizationMembers.role, ["employee", "manager"]),
      ),
    );

  const [pendingInvites] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(memberInvitations)
    .where(
      and(
        eq(memberInvitations.organizationId, organizationId),
        eq(memberInvitations.status, "pending"),
      ),
    );

  return {
    activeStores: storeCount?.count ?? 0,
    activeEmployees: employeeCount?.count ?? 0,
    pendingInvitations: pendingInvites?.count ?? 0,
  };
}
