import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { auditEvents, authIdentities, organizationMembers, users } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { upsertOwnerPasswordIdentity } from "@/features/auth/server/auth-identities";
import { resolveOrganizationOwnerMember } from "@/features/saas-admin/server/resolve-organization-owner-member";
import { syncRuntimeOwnerProfileForOrganization } from "@/features/runtime-settings/server/sync-runtime-owner-profile";

const inputSchema = z.object({
  actorUserId: z.string().uuid(),
  organizationId: z.string().uuid(),
  ownerName: z.string().trim().min(1).max(120).optional(),
  ownerUsername: z.string().trim().min(1).max(120).optional(),
  ownerPassword: z.string().trim().min(4).max(120).optional(),
});

async function assertOwnerUsernameAvailableForUser(
  username: string,
  userId: string,
  executor: Pick<ReturnType<typeof getDb>, "select">,
) {
  const normalized = username.trim().toLowerCase();
  const [existing] = await executor
    .select({ id: authIdentities.id, userId: authIdentities.userId })
    .from(authIdentities)
    .where(
      and(
        eq(authIdentities.provider, "username_password"),
        eq(authIdentities.username, normalized),
      ),
    )
    .limit(1);

  if (existing?.id && existing.userId !== userId) {
    throw new ValidationError("Owner username is already taken.");
  }
}

export async function updateSaasAccountOwner(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid SaaS owner update input.", parsed.error.flatten());
  }
  const input = parsed.data;

  if (!input.ownerName && !input.ownerUsername && !input.ownerPassword) {
    throw new ValidationError("At least one owner field must be provided to update.");
  }

  const db = getDb();
  const ownerMember = await resolveOrganizationOwnerMember(input.organizationId, db);

  if (!ownerMember?.userId) {
    throw new ValidationError("Owner member was not found for this organization.");
  }

  const now = new Date();

  const result = await db.transaction(async (tx) => {
    if (ownerMember.memberStatus !== "active") {
      await tx
        .update(organizationMembers)
        .set({ status: "active", updatedAt: now })
        .where(eq(organizationMembers.id, ownerMember.memberId));
    }

    let ownerName = ownerMember.name;
    if (input.ownerName) {
      const [updatedUser] = await tx
        .update(users)
        .set({
          name: input.ownerName.trim(),
          updatedAt: now,
        })
        .where(eq(users.id, ownerMember.userId))
        .returning({ name: users.name });
      ownerName = updatedUser.name;
    }

    let ownerUsername: string | undefined;
    if (input.ownerUsername || input.ownerPassword) {
      const [identity] = await tx
        .select({
          id: authIdentities.id,
          username: authIdentities.username,
        })
        .from(authIdentities)
        .where(
          and(
            eq(authIdentities.userId, ownerMember.userId),
            eq(authIdentities.provider, "username_password"),
          ),
        )
        .limit(1);

      const nextUsername = (input.ownerUsername || identity?.username || "").trim().toLowerCase();
      if (!nextUsername) {
        throw new ValidationError("Owner username is required when setting credentials.");
      }

      if (!identity?.id && !input.ownerPassword) {
        throw new ValidationError("Owner password is required when creating login credentials.");
      }

      await assertOwnerUsernameAvailableForUser(nextUsername, ownerMember.userId, tx);

      if (input.ownerPassword) {
        await upsertOwnerPasswordIdentity(
          {
            userId: ownerMember.userId,
            username: nextUsername,
            password: input.ownerPassword,
          },
          tx,
        );
      } else if (input.ownerUsername && identity?.id) {
        await tx
          .update(authIdentities)
          .set({
            username: nextUsername,
            updatedAt: now,
          })
          .where(eq(authIdentities.id, identity.id));
      }

      ownerUsername = nextUsername;
    }

    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: "saas_owner_updated",
      metadata: {
        memberId: ownerMember.memberId,
        userId: ownerMember.userId,
        ownerName,
        ownerUsername: ownerUsername || null,
        passwordRotated: Boolean(input.ownerPassword),
        reactivatedOwner: ownerMember.memberStatus !== "active",
      },
    });

    return {
      organizationId: input.organizationId,
      ownerMemberId: ownerMember.memberId,
      ownerUserId: ownerMember.userId,
      ownerName,
      ownerUsername: ownerUsername || ownerMember.username,
      updatedAt: now.toISOString(),
    };
  });

  if (input.ownerName) {
    await syncRuntimeOwnerProfileForOrganization({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      reason: "saas_owner_updated",
    });
  }

  return result;
}
