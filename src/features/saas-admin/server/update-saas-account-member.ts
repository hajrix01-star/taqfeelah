import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import {
  auditEvents,
  memberStoreAccess,
  organizationMembers,
  organizations,
  stores,
  users,
} from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { upsertEmployeePinIdentity } from "@/features/auth/server/auth-identities";

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
  organizationId: z.string().uuid(),
  memberId: z.string().uuid(),
  name: z.string().trim().min(1).max(120).optional(),
  role: z.enum(["manager", "employee"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  pin: z.string().trim().min(4).max(12).optional(),
  storeIds: z.array(z.string().uuid()).optional(),
});

export async function updateSaasAccountMember(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid SaaS member update input.", parsed.error.flatten());
  }
  const input = parsed.data;

  if (!input.name && !input.role && !input.status && !input.pin && !input.storeIds) {
    throw new ValidationError("At least one field must be provided to update.");
  }

  const db = getDb();
  const [organization] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.id, input.organizationId))
    .limit(1);

  if (!organization?.id) {
    throw new ValidationError("Organization was not found.");
  }

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

  if (member.role === "owner") {
    throw new ValidationError("Use the owner edit form to update the account owner.");
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
      await tx
        .update(users)
        .set({ name: input.name.trim(), updatedAt: now })
        .where(eq(users.id, member.userId));
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

    if (input.pin) {
      await upsertEmployeePinIdentity(
        {
          userId: member.userId,
          pin: input.pin,
        },
        tx,
      );
    }

    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: "saas_member_updated",
      metadata: {
        memberId: member.memberId,
        userId: member.userId,
        previousRole: member.role,
        nextRole,
        previousStatus: member.status,
        nextStatus,
        storeIds: uniqueStoreIds,
        pinRotated: Boolean(input.pin),
      },
    });

    return {
      memberId: member.memberId,
      userId: member.userId,
      name: input.name?.trim() || member.name,
      role: nextRole,
      status: nextStatus,
      storeIds: uniqueStoreIds,
      updatedAt: now.toISOString(),
    };
  });
}
