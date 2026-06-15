"use client";

import { formatLoginPhoneForDisplay } from "@/core/phone/split-login-phone";
import {
  formatInviteStatus,
  getOwnerTeamInvitesLabels,
} from "@/features/member-invitations/client/owner-team-invites-labels";

export function OwnerSettingsTeamPendingInvites({
  lang,
  pendingInvites,
  loading,
  onRevokeInvite,
}) {
  const labels = getOwnerTeamInvitesLabels(lang);

  if (loading) {
    return (
      <div className="mb-4 rounded-3xl bg-white p-4 text-center text-taq-meta font-bold text-[#827762] ring-1 ring-black/[0.045]">
        …
      </div>
    );
  }

  if (!pendingInvites.length) return null;

  return (
    <div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
      <p className="text-sm font-black">{labels.pendingTitle}</p>
      <p className="mt-1 text-taq-meta font-bold text-[#827762]">{labels.pendingHint}</p>

      <div className="mt-4 space-y-3">
        {pendingInvites.map((invite) => (
          <div key={invite.invitationId} className="rounded-2xl bg-[#F7F5EF] p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black">{invite.displayName}</p>
              <span className="rounded-full bg-white px-2 py-1 text-taq-meta font-bold">
                {formatInviteStatus(invite.status, lang)}
              </span>
            </div>
            {invite.phoneNumber ? (
              <p className="mt-1 text-taq-meta font-bold text-[#716753]" dir="ltr">
                {labels.phoneLabel}: {formatLoginPhoneForDisplay(invite.phoneNumber)}
              </p>
            ) : null}
            <p className="mt-1 text-taq-meta font-bold text-[#827762]">{invite.storeName}</p>
            <button
              type="button"
              onClick={() => { void onRevokeInvite(invite.invitationId); }}
              className="mt-2 text-taq-meta font-black text-[#B44747]"
            >
              {labels.revoke}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
