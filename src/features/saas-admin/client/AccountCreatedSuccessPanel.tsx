"use client";

import Link from "next/link";
import { useState } from "react";
import { buildWhatsAppShareUrl } from "@/core/whatsapp/share-link";
import { buildOwnerSetupWhatsAppMessage } from "@/core/messaging/whatsapp-auth-messages";
import type { CreateSaasAccountResponse } from "@/features/saas-admin/client/saas-admin-api-client";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

type AccountCreatedSuccessPanelProps = {
  created: CreateSaasAccountResponse;
};

export function AccountCreatedSuccessPanel({ created }: AccountCreatedSuccessPanelProps) {
  const { t } = useSaasAdminLocale();
  const [copiedField, setCopiedField] = useState("");

  async function copyText(value: string, field: string) {
    if (!value || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(""), 2000);
  }

  const whatsappMessage = buildOwnerSetupWhatsAppMessage({
    ownerName: created.ownerName,
    setupUrl: created.setupUrl,
    organizationName: created.organizationName,
    storeName: created.storeName,
    ownerPhone: created.ownerPhone,
  });

  function openWhatsAppShare() {
    const url = buildWhatsAppShareUrl(whatsappMessage, created.ownerPhone);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-4 rounded-xl border border-[var(--admin-border)] bg-white p-4 sm:p-6">
      <h2 className="text-base font-semibold text-[var(--admin-text)]">{t.newAccount.successTitle}</h2>
      <p className="text-sm text-[var(--admin-muted)]">{t.newAccount.successDescription}</p>

      <div className="rounded-lg bg-[#FFF8E8] p-3 text-sm" dir="ltr">
        <p className="font-semibold text-[var(--admin-text)]">{t.newAccount.setupLinkLabel}</p>
        <p className="mt-1 break-all font-mono text-xs">{created.setupUrl}</p>
        <p className="mt-3 font-semibold text-[var(--admin-text)]">{t.newAccount.ownerPhone}</p>
        <p className="mt-1 font-mono">{created.ownerPhone}</p>
        <p className="mt-3 text-xs text-[var(--admin-muted)]">
          {t.newAccount.setupExpiresLabel}: {new Date(created.setupExpiresAt).toLocaleString()}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { void copyText(created.setupUrl, "link"); }}
          className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm font-semibold"
        >
          {copiedField === "link" ? t.newAccount.copied : t.newAccount.copySetupLink}
        </button>
        <button
          type="button"
          onClick={openWhatsAppShare}
          className="rounded-lg bg-[#25D366] px-3 py-2 text-sm font-semibold text-white"
        >
          {t.newAccount.sendWhatsApp}
        </button>
        <Link
          href={`/saas-admin/accounts/${created.organizationId}`}
          className="rounded-lg bg-[var(--admin-primary)] px-3 py-2 text-sm font-semibold text-white"
        >
          {t.newAccount.openAccount}
        </Link>
      </div>
      <p className="text-xs text-[var(--admin-muted)]">{t.newAccount.whatsappOpenedHint}</p>
    </div>
  );
}
