export const MEMBER_INVITATION_STATUSES = [
  "pending",
  "used",
  "expired",
  "revoked",
  "locked",
] as const;

export type MemberInvitationStatus = (typeof MEMBER_INVITATION_STATUSES)[number];

export const INVITATION_EXPIRY_HOURS = 48;
export const INVITATION_MAX_FAILED_ATTEMPTS = 5;
