import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import {
  auditEvents,
  memberInvitations,
  memberStoreAccess,
  organizationMembers,
  users,
} from "@/core/db/schema";
import { UnauthorizedError, ValidationError } from "@/core/errors/app-error";
import { upsertEmployeePinIdentity } from "@/features/auth/server/auth-identities";
import { verifyPassword } from "@/features/auth/server/password-hash";
import { resolveEffectiveInvitationStatus } from "@/features/member-invitations/server/resolve-invitation-status";
import { INVITATION_MAX_FAILED_ATTEMPTS } from "@/features/member-invitations/server/types";
import { resolveUserDisplayName } from "@/features/auth/server/resolve-user-display-name";

const inputSchema = z.object({
  token: z.string().trim().min(8).max(200),
  activationCode: z.string().trim().min(4).max(12),
  pin: z.string().trim().min(4).max(12),
  confirmPin: z.string().trim().min(4).max(12),
});

export async function activateMemberInvitation(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid invitation activation input.", parsed.error.flatten());
  }
  const input = parsed.data;

  if (input.pin !== input.confirmPin) {
    throw new ValidationError("PIN confirmation does not match.");
  }

  const db = getDb();
  const [row] = await db
    .select({
      id: memberInvitations.id,
      organizationId: memberInvitations.organizationId,
      storeId: memberInvitations.storeId,
      displayName: memberInvitations.displayName,
      role: memberInvitations.role,
      activationCodeHash: memberInvitations.activationCodeHash,
      status: memberInvitations.status,
      expiresAt: memberInvitations.expiresAt,
      usedAt: memberInvitations.usedAt,
      revokedAt: memberInvitations.revokedAt,
      lockedAt: memberInvitations.lockedAt,
      failedAttempts: memberInvitations.failedAttempts,
    })
    .from(memberInvitations)
    .where(eq(memberInvitations.token, input.token))
    .limit(1);

  if (!row) {
    throw new ValidationError("Invitation not found.");
  }

  const effectiveStatus = resolveEffectiveInvitationStatus(row);
  if (effectiveStatus === "used") {
    throw new ValidationError("This invitation has already been used.");
  }
  if (effectiveStatus === "revoked") {
    throw new ValidationError("This invitation was cancelled.");
  }
  if (effectiveStatus === "expired") {
    throw new ValidationError("This invitation has expired.");
  }
  if (effectiveStatus === "locked") {
    throw new ValidationError("This invitation is locked after too many failed attempts.");
  }

  const codeValid = await verifyPassword(input.activationCode, row.activationCodeHash);
  if (!codeValid) {
    const nextAttempts = row.failedAttempts + 1;
    const now = new Date();
    const shouldLock = nextAttempts >= INVITATION_MAX_FAILED_ATTEMPTS;

    await db
      .update(memberInvitations)
      .set({
        failedAttempts: nextAttempts,
        status: shouldLock ? "locked" : "pending",
        lockedAt: shouldLock ? now : row.lockedAt,
        updatedAt: now,
      })
      .where(eq(memberInvitations.id, row.id));

    throw new UnauthorizedError(
      shouldLock
        ? "Too many failed attempts. This invitation is now locked."
        : "Invalid activation code.",
    );
  }

  const userId = randomUUID();
  const memberId = randomUUID();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: userId,
      name: row.displayName,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(organizationMembers).values({
      id: memberId,
      organizationId: row.organizationId,
      userId,
      role: row.role,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(memberStoreAccess).values({
      organizationMemberId: memberId,
      storeId: row.storeId,
    });

    await upsertEmployeePinIdentity({ userId, pin: input.pin }, tx);

    await tx
      .update(memberInvitations)
      .set({
        status: "used",
        usedAt: now,
        acceptedUserId: userId,
        acceptedMemberId: memberId,
        updatedAt: now,
      })
      .where(eq(memberInvitations.id, row.id));

    await tx.insert(auditEvents).values({
      organizationId: row.organizationId,
      storeId: row.storeId,
      actorUserId: userId,
      action: "member_invitation_activated",
      metadata: {
        invitationId: row.id,
        memberId,
        userId,
        role: row.role,
      },
    });
  });

  const displayName = await resolveUserDisplayName(userId);

  return {
    organizationId: row.organizationId,
    userId,
    memberId,
    role: row.role as "employee" | "manager",
    storeId: row.storeId,
    displayName,
  };
}
