"use client";

import { formatStaffInviteActivationLine } from "@/features/member-invitations/client/format-staff-invite-activation-line";
import { getOwnerTeamInvitesLabels } from "@/features/member-invitations/client/owner-team-invites-labels";
import type { OwnerSettingsStaffInviteLineProps } from "./prototype-runtime-types";

export function OwnerSettingsStaffInviteLine({ lang, invite }: OwnerSettingsStaffInviteLineProps) {
  const labels = getOwnerTeamInvitesLabels(lang);
  const line = formatStaffInviteActivationLine({ invite, labels: labels as Parameters<typeof formatStaffInviteActivationLine>[0]["labels"] });
  if (!line) return null;

  return (
    <p className="mt-1 text-taq-meta font-bold text-[#9A823E]">
      {line}
    </p>
  );
}
