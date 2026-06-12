import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { assertOrganizationAccess } from "@/core/auth/assert-organization-access";
import { getDb } from "@/core/db/client";
import { auditEvents, memberInvitations } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { resolveEffectiveInvitationStatus } from "@/features/member-invitations/server/resolve-invitation-status";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
  invitationId: z.string().uuid(),
});

export async function revokeMemberInvitation(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid invitation revoke input.", parsed.error.flatten());
  }
  const input = parsed.data;

  await assertOrganizationAccess({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    minimumRole: "owner",
  });

  const db = getDb();
  const [row] = await db
    .select({
      id: memberInvitations.id,
      status: memberInvitations.status,
      expiresAt: memberInvitations.expiresAt,
      lockedAt: memberInvitations.lockedAt,
      usedAt: memberInvitations.usedAt,
      revokedAt: memberInvitations.revokedAt,
    })
    .from(memberInvitations)
    .where(
      and(
        eq(memberInvitations.id, input.invitationId),
        eq(memberInvitations.organizationId, input.organizationId),
      ),
    )
    .limit(1);

  if (!row) {
    throw new ValidationError("Invitation not found.");
  }

  const effectiveStatus = resolveEffectiveInvitationStatus(row);
  if (effectiveStatus === "used") {
    throw new ValidationError("Used invitations cannot be revoked.");
  }
  if (effectiveStatus === "revoked") {
    return { invitationId: row.id, status: "revoked" as const };
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(memberInvitations)
      .set({
        status: "revoked",
        revokedAt: now,
        updatedAt: now,
      })
      .where(eq(memberInvitations.id, row.id));

    await tx.insert(auditEvents).values({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: "member_invitation_revoked",
      metadata: { invitationId: row.id },
    });
  });

  return { invitationId: row.id, status: "revoked" as const };
}
