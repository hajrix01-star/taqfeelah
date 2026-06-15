const PENDING_INVITE_STATUSES = new Set(["pending", "locked"]);

/**
 * @param {Array<Record<string, unknown>>} invitations
 */
export function groupTeamInvitations(invitations = []) {
  const pendingInvites = [];
  const usedInvitesByUserId = new Map();

  for (const invite of invitations) {
    if (!invite || typeof invite !== "object") continue;

    if (PENDING_INVITE_STATUSES.has(invite.status)) {
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

export function resolveStaffInviteUserKey(person) {
  if (!person || typeof person !== "object") return "";
  const apiUserId = typeof person.apiUserId === "string" ? person.apiUserId.trim() : "";
  if (apiUserId) return apiUserId;
  const id = typeof person.id === "string" ? person.id.trim() : "";
  return id;
}

function isInviteNewer(left, right) {
  return compareInvitesNewestFirst(left, right) < 0;
}

function compareInvitesNewestFirst(left, right) {
  const leftTime = Date.parse(left?.createdAt || "") || 0;
  const rightTime = Date.parse(right?.createdAt || "") || 0;
  return rightTime - leftTime;
}
