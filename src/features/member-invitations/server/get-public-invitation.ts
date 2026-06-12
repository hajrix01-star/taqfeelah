import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/core/db/client";
import { memberInvitations, organizations, stores } from "@/core/db/schema";
import { ValidationError } from "@/core/errors/app-error";
import { resolveEffectiveInvitationStatus } from "@/features/member-invitations/server/resolve-invitation-status";

const inputSchema = z.object({
  token: z.string().trim().min(8).max(200),
});

function roleLabel(role: string): string {
  if (role === "manager") return "مدير محل";
  return "موظف إدخال";
}

export async function getPublicMemberInvitation(rawInput: z.infer<typeof inputSchema>) {
  const parsed = inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError("Invalid invitation token.", parsed.error.flatten());
  }
  const input = parsed.data;

  const db = getDb();
  const [row] = await db
    .select({
      id: memberInvitations.id,
      displayName: memberInvitations.displayName,
      role: memberInvitations.role,
      status: memberInvitations.status,
      expiresAt: memberInvitations.expiresAt,
      usedAt: memberInvitations.usedAt,
      revokedAt: memberInvitations.revokedAt,
      lockedAt: memberInvitations.lockedAt,
      storeName: stores.name,
      organizationName: organizations.name,
    })
    .from(memberInvitations)
    .innerJoin(stores, eq(stores.id, memberInvitations.storeId))
    .innerJoin(organizations, eq(organizations.id, memberInvitations.organizationId))
    .where(eq(memberInvitations.token, input.token))
    .limit(1);

  if (!row) {
    throw new ValidationError("Invitation not found.");
  }

  const status = resolveEffectiveInvitationStatus(row);
  const canActivate = status === "pending";

  return {
    invitationId: row.id,
    displayName: row.displayName,
    role: row.role,
    roleLabel: roleLabel(row.role),
    organizationName: row.organizationName,
    storeName: row.storeName,
    status,
    expiresAt: row.expiresAt.toISOString(),
    canActivate,
  };
}
