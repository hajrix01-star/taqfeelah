import type { MemberInvitationStatus } from "@/features/member-invitations/server/types";

type InvitationRow = {
  status: string;
  expiresAt: Date;
  lockedAt: Date | null;
  usedAt: Date | null;
  revokedAt: Date | null;
};

export function resolveEffectiveInvitationStatus(
  row: InvitationRow,
  now = new Date(),
): MemberInvitationStatus {
  if (row.status === "revoked" || row.revokedAt) return "revoked";
  if (row.status === "used" || row.usedAt) return "used";
  if (row.status === "locked" || row.lockedAt) return "locked";
  if (row.expiresAt <= now) return "expired";
  if (row.status === "pending") return "pending";
  return row.status as MemberInvitationStatus;
}
