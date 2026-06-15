"use client";

import { formatStaffInviteActivationLine } from "@/features/member-invitations/client/format-staff-invite-activation-line";
import { getOwnerTeamInvitesLabels } from "@/features/member-invitations/client/owner-team-invites-labels";

export function OwnerSettingsStaffInviteLine({ lang, invite }) {
  const labels = getOwnerTeamInvitesLabels(lang);
  const line = formatStaffInviteActivationLine({ invite, labels });
  if (!line) return null;

  return (
    <p className="mt-1 text-taq-meta font-bold text-[#9A823E]">
      {line}
    </p>
  );
}
