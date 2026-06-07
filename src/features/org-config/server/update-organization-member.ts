import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { assertOrganizationAccess } from "@/core/auth/assert-organization-access";
import { getDb } from "@/core/db/client";
import {
  auditEvents,
  memberStoreAccess,
  organizationMembers,
  stores,
  users,
} from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import {
  upsertEmployeePinIdentity,
  upsertOwnerPasswordIdentity,
} from "@/features/auth/server/auth-identities";

const credentialsSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("owner_password"),
    username: z.string().trim().min(1).max(120),
    password: z.string().trim().min(4).max(120),
  }),
  z.object({
    type: z.literal("employee_pin"),
    pin: z.string().trim().min(4).max(12),
  }),
]);

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  memberId: z.string().uuid(),
  name: z.string().trim().min(1).max(120).optional(),
  role: z.enum(["owner", "manager", "employee"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  storeIds: z.array(z.string().uuid()).optional(),
  credentials: credentialsSchema.optional(),
  reason: z.string().trim().max(240).optional(),
});

export async function updateOrganizationMember(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid member update input.", parsed.error.flatten());
  }
  const input = parsed.data;

  await assertOrganizationAccess({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    minimumRole: "owner",
  });

  const db = getDb();
  const [member] = await db
    .select({
      memberId: organizationMembers.id,
      userId: organizationMembers.userId,
      role: organizationMembers.role,
      status: organizationMembers.status,
      name: users.name,
    })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(
      and(
        eq(organizationMembers.organizationId, input.organizationId),
        eq(organizationMembers.id, input.memberId),
      ),
    )
    .limit(1);

  if (!member) {
    throw new ValidationError("Member was not found for this organization.");
  }

  if (input.role === "owner" && input.actorRole !== "owner") {
    throw new ValidationError("Only owners can promote members to owner.");
  }

  const nextRole = input.role || member.role;
  const nextStatus = input.status || member.status;
  const uniqueStoreIds = input.storeIds ? [...new Set(input.storeIds)] : null;

  if (uniqueStoreIds?.length) {
    const storeRows = await db
      .select({ id: stores.id })
      .from(stores)
      .where(
        and(
          eq(stores.organizationId, input.organizationId),
          inArray(stores.id, uniqueStoreIds),
        ),
      );
    if (storeRows.length !== uniqueStoreIds.length) {
      throw new ValidationError("One or more storeIds are invalid for this organization.");
    }
  }

  const now = new Date();

  return db.transaction(async (tx) => {
    if (input.name) {
      await tx.update(users).set({ name: input.name, updatedAt: now }).where(eq(users.id, member.userId));
    }

    if (input.role || input.status) {
      await tx
        .update(organizationMembers)
        .set({
          role: nextRole,
          status: nextStatus,
          updatedAt: now,
        })
        .where(eq(organizationMembers.id, member.memberId));
    }

    if (uniqueStoreIds) {
      await tx
        .delete(memberStoreAccess)
        .where(eq(memberStoreAccess.organizationMemberId, member.memberId));
      if (uniqueStoreIds.length) {
        await tx.insert(memberStoreAccess).values(
          uniqueStoreIds.map((storeId) => ({
            organizationMemberId: member.memberId,
            storeId,
          })),
        );
      }
    }

    if (input.credentials?.type === "owner_password") {
      if (nextRole !== "owner") {
        throw new ValidationError("Owner password credentials require role=owner.");
      }
      await upsertOwnerPasswordIdentity(
        {
          userId: member.userId,
          username: input.credentials.username,
          password: input.credentials.password,
        },
        tx,
      );
    }

    if (input.credentials?.type === "employee_pin") {
      if (nextRole === "owner") {
        throw new ValidationError("Employee pin credentials cannot be used for owner role.");
      }
      await upsertEmployeePinIdentity(
        {
          userId: member.userId,
          pin: input.credentials.pin,
        },
        tx,
      );
    }

    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: "member_updated",
      reason: input.reason || null,
      metadata: {
        memberId: member.memberId,
        userId: member.userId,
        previousRole: member.role,
        nextRole,
        previousStatus: member.status,
        nextStatus,
        storeIds: uniqueStoreIds,
        hasCredentials: Boolean(input.credentials),
      },
    });

    return {
      memberId: member.memberId,
      userId: member.userId,
      name: input.name || member.name,
      role: nextRole,
      status: nextStatus,
      storeIds: uniqueStoreIds,
      updatedAt: now.toISOString(),
    };
  });
}
