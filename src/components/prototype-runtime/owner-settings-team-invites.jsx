"use client";

import React from "react";
import { formatLoginPhoneForDisplay } from "@/core/phone/split-login-phone";
import {
  formatInviteStatus,
  getOwnerTeamInvitesLabels,
} from "@/features/member-invitations/client/owner-team-invites-labels";
import { useOwnerTeamInvites } from "@/features/member-invitations/client/use-owner-team-invites";

export function OwnerSettingsTeamInvites({
  lang,
  organizationId,
  actorUserId,
  actorRole,
  activeStoredBusinesses,
  displayBusinessName,
}) {
  const labels = getOwnerTeamInvitesLabels(lang);
  const invites = useOwnerTeamInvites({
    organizationId,
    actorUserId,
    actorRole,
    activeStoredBusinesses,
  });

  return (
    <div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
      <p className="text-sm font-black">{labels.title}</p>
      <p className="mt-1 text-taq-meta font-bold text-[#827762]">{labels.hint}</p>

      <div className="mt-4 space-y-2">
        <input
          value={invites.displayName}
          onChange={(event) => invites.setDisplayName(event.target.value)}
          placeholder={labels.name}
          className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none"
        />
        <input
          dir="ltr"
          value={invites.phoneNumber}
          onChange={(event) => invites.setPhoneNumber(event.target.value)}
          placeholder={labels.phone}
          className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none"
        />
        <input
          dir="ltr"
          inputMode="numeric"
          value={invites.pin}
          onChange={(event) => invites.setPin(event.target.value)}
          placeholder={labels.pin}
          className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none"
          minLength={4}
          maxLength={12}
        />
        <select
          value={invites.storeId}
          onChange={(event) => invites.setStoreId(event.target.value)}
          className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none"
        >
          {activeStoredBusinesses.map((business) => (
            <option key={business.id} value={business.id}>{displayBusinessName(business)}</option>
          ))}
        </select>
        <select
          value={invites.role}
          onChange={(event) => invites.setRole(event.target.value)}
          className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none"
        >
          <option value="employee">{labels.roleEmployee}</option>
          <option value="manager">{labels.roleManager}</option>
        </select>
        <button
          type="button"
          disabled={!invites.canCreate}
          onClick={() => { void invites.createInvite(); }}
          className="w-full rounded-2xl bg-[#112A46] py-3 text-xs font-black text-white disabled:bg-[#B8C0B7]"
        >
          {invites.creating ? labels.creating : labels.create}
        </button>
      </div>

      {invites.createdInvite ? (
        <div className="mt-4 rounded-2xl bg-[#FFF8E8] p-3">
          <p className="text-taq-meta font-bold text-[#806528]">{labels.inviteUrl}</p>
          <p dir="ltr" className="mt-1 break-all text-xs font-black">{invites.createdInvite.inviteUrl}</p>
          <p className="mt-3 text-taq-meta font-bold text-[#806528]">{labels.pinLabel}</p>
          <p dir="ltr" className="mt-1 text-lg font-black tracking-[0.3em]">{invites.createdInvite.pin}</p>
          <p className="mt-3 text-taq-meta font-bold text-[#806528]">{labels.expiresAt}</p>
          <p dir="ltr" className="mt-1 text-xs font-black">
            {new Date(invites.createdInvite.expiresAt).toLocaleString(lang === "ar" ? "ar-SA" : "en-US")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => { void invites.copyText(invites.createdInvite.inviteUrl, "link"); }} className="rounded-full bg-white px-3 py-2 text-taq-meta font-black">{invites.copiedField === "link" ? labels.copied : labels.copyLink}</button>
            <button type="button" onClick={() => { void invites.copyText(invites.createdInvite.pin, "pin"); }} className="rounded-full bg-white px-3 py-2 text-taq-meta font-black">{invites.copiedField === "pin" ? labels.copied : labels.copyPin}</button>
            <button type="button" onClick={() => invites.shareInviteWhatsApp(invites.createdInvite)} className="rounded-full bg-[#25D366] px-3 py-2 text-taq-meta font-black text-white">{labels.shareWhatsApp}</button>
            <button type="button" onClick={() => { void invites.revokeInvite(invites.createdInvite.invitationId); }} className="rounded-full bg-[#FFF1EE] px-3 py-2 text-taq-meta font-black text-[#B44747]">{labels.revoke}</button>
          </div>
        </div>
      ) : null}

      {invites.error ? (
        <p className="mt-3 rounded-xl bg-[#FFF1EE] p-2.5 text-center text-taq-meta font-bold text-[#B44747]">{invites.error}</p>
      ) : null}

      <div className="mt-4 space-y-3">
        {invites.loading ? <p className="text-center text-taq-meta font-bold text-[#827762]">…</p> : null}
        {!invites.loading && invites.invitations.length === 0 ? (
          <p className="text-center text-taq-meta font-bold text-[#827762]">{labels.noInvites}</p>
        ) : null}
        {invites.invitations.map((invite) => (
          <div key={invite.invitationId} className="rounded-2xl bg-[#F7F5EF] p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black">{invite.displayName}</p>
              <span className="rounded-full bg-white px-2 py-1 text-taq-meta font-bold">{formatInviteStatus(invite.status, lang)}</span>
            </div>
            {invite.invitationDisplayName
              && invite.invitationDisplayName !== invite.displayName ? (
                <p className="mt-1 text-taq-meta font-bold text-[#827762]">
                  {labels.inviteAlias}: {invite.invitationDisplayName}
                </p>
              ) : null}
            {invite.phoneNumber ? (
              <p className="mt-1 text-taq-meta font-bold text-[#716753]" dir="ltr">
                {labels.phoneLabel}: {formatLoginPhoneForDisplay(invite.phoneNumber)}
              </p>
            ) : null}
            <p className="mt-1 text-taq-meta font-bold text-[#827762]">{invite.storeName}</p>
            {invite.status === "pending" ? (
              <button
                type="button"
                onClick={() => { void invites.revokeInvite(invite.invitationId); }}
                className="mt-2 text-taq-meta font-black text-[#B44747]"
              >
                {labels.revoke}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
