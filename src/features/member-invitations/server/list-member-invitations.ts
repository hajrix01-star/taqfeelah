import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { assertOrganizationAccess } from "@/core/auth/assert-organization-access";
import { buildInviteUrl } from "@/core/auth/app-origin";
import { getDb } from "@/core/db/client";
import { memberInvitations, organizations, stores, users } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { resolveEffectiveInvitationStatus } from "@/features/member-invitations/server/resolve-invitation-status";
import { resolveInvitationListDisplayName } from "@/features/member-invitations/server/resolve-invitation-list-display-name";

const inputSchema = z.object({
  organizationId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["owner", "manager", "employee"]),
});

export async function listMemberInvitations(
  rawInput: z.infer<typeof inputSchema>,
  request?: Request,
) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid invitation list input.", parsed.error.flatten());
  }
  const input = parsed.data;

  await assertOrganizationAccess({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    minimumRole: "owner",
  });

  const db = getDb();
  const rows = await db
    .select({
      id: memberInvitations.id,
      token: memberInvitations.token,
      displayName: memberInvitations.displayName,
      role: memberInvitations.role,
      phoneNumber: memberInvitations.phoneNumber,
      status: memberInvitations.status,
      expiresAt: memberInvitations.expiresAt,
      usedAt: memberInvitations.usedAt,
      revokedAt: memberInvitations.revokedAt,
      lockedAt: memberInvitations.lockedAt,
      failedAttempts: memberInvitations.failedAttempts,
      createdAt: memberInvitations.createdAt,
      storeId: memberInvitations.storeId,
      acceptedUserId: memberInvitations.acceptedUserId,
      acceptedMemberName: users.name,
      storeName: stores.name,
      organizationName: organizations.name,
    })
    .from(memberInvitations)
    .innerJoin(stores, eq(stores.id, memberInvitations.storeId))
    .innerJoin(organizations, eq(organizations.id, memberInvitations.organizationId))
    .leftJoin(users, eq(users.id, memberInvitations.acceptedUserId))
    .where(eq(memberInvitations.organizationId, input.organizationId))
    .orderBy(desc(memberInvitations.createdAt));

  const now = new Date();
  return {
    invitations: rows.map((row) => {
      const status = resolveEffectiveInvitationStatus(row, now);
      const names = resolveInvitationListDisplayName({
        invitationDisplayName: row.displayName,
        acceptedMemberName: row.acceptedMemberName,
        status,
      });

      return {
        invitationId: row.id,
        inviteUrl: buildInviteUrl(row.token, request),
        displayName: names.displayName,
        invitationDisplayName: names.invitationDisplayName,
        acceptedUserId: row.acceptedUserId,
        role: row.role,
        phoneNumber: row.phoneNumber,
        status,
        expiresAt: row.expiresAt.toISOString(),
        usedAt: row.usedAt?.toISOString() ?? null,
        revokedAt: row.revokedAt?.toISOString() ?? null,
        failedAttempts: row.failedAttempts,
        storeId: row.storeId,
        storeName: row.storeName,
        organizationName: row.organizationName,
        createdAt: row.createdAt.toISOString(),
      };
    }),
  };
}
