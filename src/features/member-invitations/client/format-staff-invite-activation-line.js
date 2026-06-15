/**
 * @param {{
 *   invite?: {
 *     storeName?: string;
 *     invitationDisplayName?: string;
 *     displayName?: string;
 *   } | null;
 *   labels: {
 *     activatedViaInvite: string;
 *     inviteAlias: string;
 *   };
 * }} input
 */
export function formatStaffInviteActivationLine({ invite, labels }) {
  if (!invite) return "";

  const storeName = typeof invite.storeName === "string" ? invite.storeName.trim() : "";
  const invitationDisplayName = typeof invite.invitationDisplayName === "string"
    ? invite.invitationDisplayName.trim()
    : "";
  const displayName = typeof invite.displayName === "string" ? invite.displayName.trim() : "";
  const alias = invitationDisplayName && invitationDisplayName !== displayName
    ? invitationDisplayName
    : "";

  if (alias) {
    return `${labels.activatedViaInvite} (${alias})${storeName ? ` · ${storeName}` : ""}`;
  }

  return `${labels.activatedViaInvite}${storeName ? ` · ${storeName}` : ""}`;
}
