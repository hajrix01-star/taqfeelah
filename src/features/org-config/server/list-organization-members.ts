import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { assertOrganizationAccess } from "@/core/auth/assert-organization-access";
import { getDb } from "@/core/db/client";
import { authIdentities, memberStoreAccess, organizationMembers, stores, users } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  status: z.enum(["active", "inactive", "all"]).default("active"),
});

export async function listOrganizationMembers(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid members list input.", parsed.error.flatten());
  }
  const input = parsed.data;

  await assertOrganizationAccess({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    minimumRole: "manager",
  });

  const db = getDb();
  const memberRows = await db
    .select({
      memberId: organizationMembers.id,
      userId: users.id,
      name: users.name,
      role: organizationMembers.role,
      status: organizationMembers.status,
      createdAt: organizationMembers.createdAt,
      updatedAt: organizationMembers.updatedAt,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(
      and(
        eq(organizationMembers.organizationId, input.organizationId),
        input.status === "all" ? undefined : eq(organizationMembers.status, input.status),
      ),
    )
    .orderBy(asc(users.name), asc(organizationMembers.id));

  const memberIds = memberRows.map((row) => row.memberId);
  const userIds = memberRows.map((row) => row.userId);
  const loginPhoneByUserId = new Map<string, string>();

  if (userIds.length) {
    const phoneRows = await db
      .select({
        userId: authIdentities.userId,
        loginPhone: authIdentities.loginPhone,
      })
      .from(authIdentities)
      .where(
        and(
          inArray(authIdentities.userId, userIds),
          eq(authIdentities.provider, "employee_pin"),
        ),
      );

    phoneRows.forEach((row) => {
      if (row.loginPhone) loginPhoneByUserId.set(row.userId, row.loginPhone);
    });
  }

  const accessRows = memberIds.length
    ? await db
      .select({
        memberId: memberStoreAccess.organizationMemberId,
        storeId: memberStoreAccess.storeId,
        storeName: stores.name,
        storeStatus: stores.status,
      })
      .from(memberStoreAccess)
      .innerJoin(stores, eq(stores.id, memberStoreAccess.storeId))
      .where(
        and(
          eq(stores.organizationId, input.organizationId),
          inArray(memberStoreAccess.organizationMemberId, memberIds),
        ),
      )
    : [];

  const storeAccessByMemberId = new Map<string, Array<{ storeId: string; storeName: string; storeStatus: string }>>();
  accessRows.forEach((row) => {
    const current = storeAccessByMemberId.get(row.memberId) || [];
    current.push({
      storeId: row.storeId,
      storeName: row.storeName,
      storeStatus: row.storeStatus,
    });
    storeAccessByMemberId.set(row.memberId, current);
  });

  return {
    members: memberRows.map((row) => ({
      memberId: row.memberId,
      userId: row.userId,
      name: row.name,
      role: row.role,
      status: row.status,
      loginPhone: loginPhoneByUserId.get(row.userId) ?? null,
      storeAccess: storeAccessByMemberId.get(row.memberId) || [],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  };
}
