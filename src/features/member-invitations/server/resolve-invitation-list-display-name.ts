export function resolveInvitationListDisplayName(input: {
  invitationDisplayName: string;
  acceptedMemberName?: string | null;
  status: string;
}): {
  displayName: string;
  invitationDisplayName: string;
} {
  const invitationDisplayName = input.invitationDisplayName.trim();
  const acceptedMemberName = typeof input.acceptedMemberName === "string"
    ? input.acceptedMemberName.trim()
    : "";

  if (input.status === "used" && acceptedMemberName) {
    return {
      displayName: acceptedMemberName,
      invitationDisplayName,
    };
  }

  return {
    displayName: invitationDisplayName,
    invitationDisplayName,
  };
}
