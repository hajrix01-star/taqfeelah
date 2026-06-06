import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { assertPlatformAdminAccess } from "@/core/auth/assert-platform-admin-access";
import { getDb } from "@/core/db/client";
import { organizations, subscriptions } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
  status: z.enum(["active", "suspended", "all"]).default("all"),
  limit: z.number().int().min(1).max(100).default(50),
});

export async function listSaasOrganizations(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid SaaS organizations list input.", parsed.error.flatten());
  }
  const input = parsed.data;
  assertPlatformAdminAccess({ actorUserId: input.actorUserId });

  const db = getDb();
  const orgRows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      status: organizations.status,
      createdAt: organizations.createdAt,
      updatedAt: organizations.updatedAt,
    })
    .from(organizations)
    .where(input.status === "all" ? undefined : eq(organizations.status, input.status))
    .orderBy(desc(organizations.updatedAt), asc(organizations.name))
    .limit(input.limit);

  const orgIds = orgRows.map((row) => row.id);
  const subscriptionRows = orgIds.length
    ? await db
      .select({
        organizationId: subscriptions.organizationId,
        planCode: subscriptions.planCode,
        status: subscriptions.status,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
      })
      .from(subscriptions)
      .where(
        and(
          inArray(subscriptions.organizationId, orgIds),
          eq(subscriptions.status, "active"),
        ),
      )
    : [];

  const subscriptionByOrgId = new Map(
    subscriptionRows.map((row) => [row.organizationId, row]),
  );

  return {
    organizations: orgRows.map((row) => {
      const subscription = subscriptionByOrgId.get(row.id);
      return {
        id: row.id,
        name: row.name,
        status: row.status,
        planCode: subscription?.planCode || null,
        subscriptionStatus: subscription?.status || null,
        currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString() || null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    }),
  };
}
