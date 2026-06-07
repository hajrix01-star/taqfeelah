import { randomUUID } from "node:crypto";
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
  name: z.string().trim().min(1).max(120),
  role: z.enum(["owner", "manager", "employee"]),
  storeIds: z.array(z.string().uuid()).default([]),
  credentials: credentialsSchema.optional(),
});

export async function createOrganizationMember(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid member create input.", parsed.error.flatten());
  }
  const input = parsed.data;

  await assertOrganizationAccess({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    minimumRole: "owner",
  });

  if (input.role === "owner" && input.actorRole !== "owner") {
    throw new ValidationError("Only owners can create owner members.");
  }

  const uniqueStoreIds = [...new Set(input.storeIds)];
  const db = getDb();
  if (uniqueStoreIds.length) {
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

  const userId = randomUUID();
  const memberId = randomUUID();
  const now = new Date();

  return db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: userId,
      name: input.name,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(organizationMembers).values({
      id: memberId,
      organizationId: input.organizationId,
      userId,
      role: input.role,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    if (uniqueStoreIds.length) {
      await tx.insert(memberStoreAccess).values(
        uniqueStoreIds.map((storeId) => ({
          organizationMemberId: memberId,
          storeId,
        })),
      );
    }

    if (input.credentials?.type === "owner_password") {
      if (input.role !== "owner") {
        throw new ValidationError("Owner password credentials require role=owner.");
      }
      await upsertOwnerPasswordIdentity(
        {
          userId,
          username: input.credentials.username,
          password: input.credentials.password,
        },
        tx,
      );
    }

    if (input.credentials?.type === "employee_pin") {
      if (input.role === "owner") {
        throw new ValidationError("Employee pin credentials cannot be used for owner role.");
      }
      await upsertEmployeePinIdentity(
        {
          userId,
          pin: input.credentials.pin,
        },
        tx,
      );
    }

    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: "member_created",
      metadata: {
        memberId,
        userId,
        role: input.role,
        storeIds: uniqueStoreIds,
        hasCredentials: Boolean(input.credentials),
      },
    });

    return {
      memberId,
      userId,
      name: input.name,
      role: input.role,
      status: "active",
      storeIds: uniqueStoreIds,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  });
}
