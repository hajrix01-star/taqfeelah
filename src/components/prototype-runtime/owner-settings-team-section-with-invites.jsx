"use client";

import { useMemo } from "react";
import { useOwnerTeamInvites } from "@/features/member-invitations/client/use-owner-team-invites";
import { groupTeamInvitations } from "@/features/member-invitations/client/group-team-invitations";
import { OwnerSettingsTeamInviteCreate } from "./owner-settings-team-invite-create";
import { OwnerSettingsTeamPendingInvites } from "./owner-settings-team-pending-invites";
import { OwnerSettingsTeamRoster } from "./owner-settings-team-roster";

export function OwnerSettingsTeamSectionWithInvites({
  inviteApiContext,
  lang,
  activeStoredBusinesses,
  displayBusinessName,
  rosterProps,
}) {
  const teamInvites = useOwnerTeamInvites({
    organizationId: inviteApiContext.organizationId,
    actorUserId: inviteApiContext.actorUserId,
    actorRole: inviteApiContext.actorRole || "owner",
    activeStoredBusinesses,
  });

  const groupedInvites = useMemo(
    () => groupTeamInvitations(teamInvites.invitations),
    [teamInvites.invitations],
  );

  return (
    <>
      <OwnerSettingsTeamInviteCreate
        lang={lang}
        activeStoredBusinesses={activeStoredBusinesses}
        displayBusinessName={displayBusinessName}
        invites={teamInvites}
      />
      <OwnerSettingsTeamPendingInvites
        lang={lang}
        pendingInvites={groupedInvites.pendingInvites}
        loading={teamInvites.loading}
        onRevokeInvite={teamInvites.revokeInvite}
      />
      <OwnerSettingsTeamRoster
        {...rosterProps}
        lang={lang}
        activeStoredBusinesses={activeStoredBusinesses}
        displayBusinessName={displayBusinessName}
        groupedInvites={groupedInvites}
      />
    </>
  );
}
