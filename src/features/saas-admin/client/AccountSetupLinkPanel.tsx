"use client";

import { useState } from "react";
import { formatLoginPhoneForDisplay } from "@/core/phone/split-login-phone";
import { buildWhatsAppShareUrl } from "@/core/whatsapp/share-link";
import { buildOwnerSetupWhatsAppMessage } from "@/core/messaging/whatsapp-auth-messages";
import { createAccountSetupLink } from "@/features/saas-admin/client/saas-admin-api-client";
import { AdminCard } from "@/features/saas-admin/components/AdminCard";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

type AccountSetupLinkPanelProps = {
  organizationId: string;
  ownerName: string;
  ownerPhone: string | null;
  organizationName: string;
  storeName: string;
};

export function AccountSetupLinkPanel({
  organizationId,
  ownerName,
  ownerPhone,
  organizationName,
  storeName,
}: AccountSetupLinkPanelProps) {
  const { t } = useSaasAdminLocale();
  const [loading, setLoading] = useState(false);
  const [setupUrl, setSetupUrl] = useState("");
  const [error, setError] = useState("");

  async function regenerateLink(purpose: "onboarding" | "password_reset") {
    setLoading(true);
    setError("");
    try {
      const result = await createAccountSetupLink(organizationId, purpose);
      setSetupUrl(result.setupUrl);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t.accountSetupLink.error);
    } finally {
      setLoading(false);
    }
  }

  function shareWhatsApp() {
    if (!setupUrl || !ownerPhone) return;
    const message = buildOwnerSetupWhatsAppMessage({
      ownerName,
      setupUrl,
      organizationName,
      storeName,
      ownerPhone,
    });
    window.open(buildWhatsAppShareUrl(message, ownerPhone), "_blank", "noopener,noreferrer");
  }

  return (
    <AdminCard padding="md">
      <h3 className="text-sm font-semibold text-[var(--admin-text)]">{t.accountSetupLink.title}</h3>
      <p className="mt-1 text-xs text-[var(--admin-muted)]">{t.accountSetupLink.description}</p>
      {ownerPhone ? (
        <p className="mt-2 text-xs text-[var(--admin-muted)]" dir="ltr">
          {t.newAccount.ownerPhone}
          {": "}
          <span className="font-mono font-semibold text-[var(--admin-text)]">
            {formatLoginPhoneForDisplay(ownerPhone)}
          </span>
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => { void regenerateLink("password_reset"); }}
          className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
        >
          {loading ? t.accountSetupLink.generating : t.accountSetupLink.resetPassword}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => { void regenerateLink("onboarding"); }}
          className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
        >
          {t.accountSetupLink.onboarding}
        </button>
        {setupUrl && ownerPhone ? (
          <button
            type="button"
            onClick={shareWhatsApp}
            className="rounded-lg bg-[#25D366] px-3 py-2 text-xs font-semibold text-white"
          >
            {t.accountSetupLink.shareWhatsApp}
          </button>
        ) : null}
      </div>
      {setupUrl ? (
        <p dir="ltr" className="mt-3 break-all rounded-lg bg-[#FFF8E8] p-2 text-xs font-mono">{setupUrl}</p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-[var(--admin-danger)]">{error}</p> : null}
    </AdminCard>
  );
}
