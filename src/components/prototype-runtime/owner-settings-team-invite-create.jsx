"use client";

import { StandardLoginPhoneField } from "@/core/phone/StandardLoginPhoneField";
import { formatDisplayDateTime } from "@/core/i18n/display-locale";
import {
  getOwnerTeamInvitesLabels,
} from "@/features/member-invitations/client/owner-team-invites-labels";

export function OwnerSettingsTeamInviteCreate({
  lang,
  activeStoredBusinesses,
  displayBusinessName,
  invites,
}) {
  const labels = getOwnerTeamInvitesLabels(lang);

  return (
    <div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
      <p className="text-sm font-black">{labels.createTitle}</p>

      <div className="mt-4 space-y-2">
        <input
          value={invites.displayName}
          onChange={(event) => invites.setDisplayName(event.target.value)}
          placeholder={labels.name}
          className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none"
        />
        <div>
          <p className="mb-2 text-xs font-black text-[#716753]">{labels.phone}</p>
          <StandardLoginPhoneField
            surface="owner"
            value={invites.phoneNumber}
            onChange={invites.setPhoneNumber}
          />
        </div>
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
            {formatDisplayDateTime(invites.createdInvite.expiresAt, lang)}
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
    </div>
  );
}
