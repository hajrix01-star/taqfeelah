import type { TeamInvitation } from "@/features/member-invitations/client/member-invitations-client-types";

const PENDING_INVITE_STATUSES = new Set(["pending", "locked"]);

export function groupTeamInvitations(invitations: TeamInvitation[] = []) {
  const pendingInvites: TeamInvitation[] = [];
  const usedInvitesByUserId = new Map<string, TeamInvitation>();

  for (const invite of invitations) {
    if (!invite || typeof invite !== "object") continue;

    if (PENDING_INVITE_STATUSES.has(String(invite.status || ""))) {
      pendingInvites.push(invite);
      continue;
    }

    if (invite.status !== "used") continue;

    const acceptedUserId = typeof invite.acceptedUserId === "string"
      ? invite.acceptedUserId.trim()
      : "";
    if (!acceptedUserId) continue;

    const existing = usedInvitesByUserId.get(acceptedUserId);
    if (!existing || isInviteNewer(invite, existing)) {
      usedInvitesByUserId.set(acceptedUserId, invite);
    }
  }

  pendingInvites.sort(compareInvitesNewestFirst);

  return {
    pendingInvites,
    usedInvitesByUserId,
  };
}

export function resolveStaffInviteUserKey(person: Record<string, unknown> | null | undefined) {
  if (!person || typeof person !== "object") return "";
  const apiUserId = typeof person.apiUserId === "string" ? person.apiUserId.trim() : "";
  if (apiUserId) return apiUserId;
  const id = typeof person.id === "string" ? person.id.trim() : "";
  return id;
}

function isInviteNewer(left: TeamInvitation, right: TeamInvitation) {
  return compareInvitesNewestFirst(left, right) < 0;
}

function compareInvitesNewestFirst(left: TeamInvitation, right: TeamInvitation) {
  const leftTime = Date.parse(left?.createdAt || "") || 0;
  const rightTime = Date.parse(right?.createdAt || "") || 0;
  return rightTime - leftTime;
}
