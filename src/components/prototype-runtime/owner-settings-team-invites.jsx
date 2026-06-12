"use client";

import React, { useCallback, useEffect, useState } from "react";
import { buildWhatsAppShareUrl } from "@/core/whatsapp/share-link";
import { buildEmployeeInviteWhatsAppMessage } from "@/core/messaging/whatsapp-auth-messages";
import {
  createMemberInvitationViaApi,
  fetchMemberInvitationsViaApi,
  revokeMemberInvitationViaApi,
} from "@/features/member-invitations/client/member-invitations-api-client";

function formatInviteStatus(status, lang) {
  const labels = {
    ar: {
      pending: "قيد الانتظار",
      used: "مستخدمة",
      expired: "منتهية",
      revoked: "ملغاة",
      locked: "مقفلة",
    },
    en: {
      pending: "Pending",
      used: "Used",
      expired: "Expired",
      revoked: "Revoked",
      locked: "Locked",
    },
  };
  return labels[lang]?.[status] || status;
}

export function OwnerSettingsTeamInvites({
  lang,
  organizationId,
  actorUserId,
  actorRole,
  activeStoredBusinesses,
  displayBusinessName,
}) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState("employee");
  const [storeId, setStoreId] = useState(activeStoredBusinesses[0]?.id || "");
  const [creating, setCreating] = useState(false);
  const [createdInvite, setCreatedInvite] = useState(null);
  const [copiedField, setCopiedField] = useState("");

  const loadInvitations = useCallback(async () => {
    if (!organizationId || !actorUserId) return;
    setLoading(true);
    setError("");
    try {
      const payload = await fetchMemberInvitationsViaApi({
        organizationId,
        actorUserId,
        actorRole,
      });
      setInvitations(Array.isArray(payload?.invitations) ? payload.invitations : []);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Failed to load invitations.");
    } finally {
      setLoading(false);
    }
  }, [actorRole, actorUserId, organizationId]);

  useEffect(() => {
    void loadInvitations();
  }, [loadInvitations]);

  useEffect(() => {
    if (!storeId && activeStoredBusinesses[0]?.id) {
      setStoreId(activeStoredBusinesses[0].id);
    }
  }, [activeStoredBusinesses, storeId]);

  async function copyText(value, field) {
    if (!value || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(""), 2000);
  }

  async function handleCreateInvite() {
    if (!displayName.trim() || !phoneNumber.trim() || !pin.trim() || !storeId || creating) return;
    setCreating(true);
    setError("");
    try {
      const created = await createMemberInvitationViaApi({
        organizationId,
        actorUserId,
        actorRole,
        displayName: displayName.trim(),
        role,
        storeId,
        phoneNumber: phoneNumber.trim(),
        pin: pin.trim(),
      });
      setCreatedInvite(created);
      setDisplayName("");
      setPhoneNumber("");
      setPin("");
      await loadInvitations();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Failed to create invitation.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(invitationId) {
    setError("");
    try {
      await revokeMemberInvitationViaApi({
        organizationId,
        actorUserId,
        actorRole,
        invitationId,
      });
      if (createdInvite?.invitationId === invitationId) setCreatedInvite(null);
      await loadInvitations();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Failed to revoke invitation.");
    }
  }

  function openWhatsAppInvite(invite) {
    const message = buildEmployeeInviteWhatsAppMessage({
      employeeName: invite.displayName,
      organizationName: invite.organizationName,
      storeName: invite.storeName,
      inviteUrl: invite.inviteUrl,
      pin: invite.pin,
    });
    const url = buildWhatsAppShareUrl(message, invite.phoneNumber);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const labels = lang === "ar"
    ? {
      title: "دعوات الموظفين",
      hint: "كل موظف له دعوة مستقلة — جوال إلزامي وPIN تُرسله أنت عبر واتساب.",
      name: "اسم الموظف (للعرض فقط)",
      phone: "جوال الموظف",
      pin: "PIN للتفعيل (مرة واحدة)",
      store: "المحل",
      roleEmployee: "موظف إدخال",
      roleManager: "مدير محل",
      create: "إنشاء دعوة",
      creating: "جاري الإنشاء…",
      inviteUrl: "رابط الدعوة",
      pinLabel: "PIN",
      copyLink: "نسخ الرابط",
      copyPin: "نسخ PIN",
      shareWhatsApp: "مشاركة عبر واتساب",
      revoke: "إلغاء الدعوة",
      expiresAt: "تنتهي في",
      noInvites: "لا توجد دعوات بعد.",
      copied: "تم النسخ",
    }
    : {
      title: "Employee invitations",
      hint: "Each employee gets a private invite — mobile is required and you send the PIN via WhatsApp.",
      name: "Employee display name",
      phone: "Employee mobile",
      pin: "Activation PIN (one-time)",
      store: "Store",
      roleEmployee: "Entry employee",
      roleManager: "Store manager",
      create: "Create invitation",
      creating: "Creating…",
      inviteUrl: "Invite link",
      pinLabel: "PIN",
      copyLink: "Copy link",
      copyPin: "Copy PIN",
      shareWhatsApp: "Share via WhatsApp",
      revoke: "Revoke invitation",
      expiresAt: "Expires at",
      noInvites: "No invitations yet.",
      copied: "Copied",
    };

  return (
    <div className="mb-4 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
      <p className="text-sm font-black">{labels.title}</p>
      <p className="mt-1 text-taq-meta font-bold text-[#827762]">{labels.hint}</p>

      <div className="mt-4 space-y-2">
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder={labels.name}
          className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none"
        />
        <input
          dir="ltr"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
          placeholder={labels.phone}
          className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none"
        />
        <input
          dir="ltr"
          inputMode="numeric"
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          placeholder={labels.pin}
          className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none"
          minLength={4}
          maxLength={12}
        />
        <select
          value={storeId}
          onChange={(event) => setStoreId(event.target.value)}
          className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none"
        >
          {activeStoredBusinesses.map((business) => (
            <option key={business.id} value={business.id}>{displayBusinessName(business)}</option>
          ))}
        </select>
        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="w-full rounded-2xl bg-[#F7F5EF] px-4 py-3 text-xs font-black outline-none"
        >
          <option value="employee">{labels.roleEmployee}</option>
          <option value="manager">{labels.roleManager}</option>
        </select>
        <button
          type="button"
          disabled={creating || !displayName.trim() || !phoneNumber.trim() || !pin.trim() || !storeId}
          onClick={() => { void handleCreateInvite(); }}
          className="w-full rounded-2xl bg-[#112A46] py-3 text-xs font-black text-white disabled:bg-[#B8C0B7]"
        >
          {creating ? labels.creating : labels.create}
        </button>
      </div>

      {createdInvite ? (
        <div className="mt-4 rounded-2xl bg-[#FFF8E8] p-3">
          <p className="text-taq-meta font-bold text-[#806528]">{labels.inviteUrl}</p>
          <p dir="ltr" className="mt-1 break-all text-xs font-black">{createdInvite.inviteUrl}</p>
          <p className="mt-3 text-taq-meta font-bold text-[#806528]">{labels.pinLabel}</p>
          <p dir="ltr" className="mt-1 text-lg font-black tracking-[0.3em]">{createdInvite.pin}</p>
          <p className="mt-3 text-taq-meta font-bold text-[#806528]">{labels.expiresAt}</p>
          <p dir="ltr" className="mt-1 text-xs font-black">{new Date(createdInvite.expiresAt).toLocaleString(lang === "ar" ? "ar-SA" : "en-US")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => { void copyText(createdInvite.inviteUrl, "link"); }} className="rounded-full bg-white px-3 py-2 text-taq-meta font-black">{copiedField === "link" ? labels.copied : labels.copyLink}</button>
            <button type="button" onClick={() => { void copyText(createdInvite.pin, "pin"); }} className="rounded-full bg-white px-3 py-2 text-taq-meta font-black">{copiedField === "pin" ? labels.copied : labels.copyPin}</button>
            <button type="button" onClick={() => openWhatsAppInvite(createdInvite)} className="rounded-full bg-[#25D366] px-3 py-2 text-taq-meta font-black text-white">{labels.shareWhatsApp}</button>
            <button type="button" onClick={() => { void handleRevoke(createdInvite.invitationId); }} className="rounded-full bg-[#FFF1EE] px-3 py-2 text-taq-meta font-black text-[#B44747]">{labels.revoke}</button>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-3 rounded-xl bg-[#FFF1EE] p-2.5 text-center text-taq-meta font-bold text-[#B44747]">{error}</p> : null}

      <div className="mt-4 space-y-3">
        {loading ? <p className="text-center text-taq-meta font-bold text-[#827762]">…</p> : null}
        {!loading && invitations.length === 0 ? (
          <p className="text-center text-taq-meta font-bold text-[#827762]">{labels.noInvites}</p>
        ) : null}
        {invitations.map((invite) => (
          <div key={invite.invitationId} className="rounded-2xl bg-[#F7F5EF] p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black">{invite.displayName}</p>
              <span className="rounded-full bg-white px-2 py-1 text-taq-meta font-bold">{formatInviteStatus(invite.status, lang)}</span>
            </div>
            <p className="mt-1 text-taq-meta font-bold text-[#827762]">{invite.storeName}</p>
            {invite.status === "pending" ? (
              <button
                type="button"
                onClick={() => { void handleRevoke(invite.invitationId); }}
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
