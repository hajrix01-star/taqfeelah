"use client";

import Link from "next/link";
import { useState } from "react";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";
import { logoutSaasAdminSession } from "@/features/saas-admin/client/saas-admin-session";
import type { SaasAdminSessionView } from "@/features/saas-admin/server/resolve-saas-admin-session-view";
import { ReleaseVersionLine } from "@/release/ReleaseVersionLine";

type AdminSessionFooterProps = {
  session: SaasAdminSessionView;
};

export function AdminSessionFooter({ session }: AdminSessionFooterProps) {
  const { locale, t } = useSaasAdminLocale();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleLogout() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await logoutSaasAdminSession();
      window.location.assign("/saas-admin/login");
    } catch {
      setIsSigningOut(false);
    }
  }

  const signedInLabel = session.displayName
    ? t.auth.signedInAs.replace("{name}", session.displayName)
    : t.auth.signedIn;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
          {t.auth.sessionLabel}
        </p>
        <p className="mt-1 text-sm font-semibold text-[var(--admin-text)]">{signedInLabel}</p>
        <p className="mt-0.5 text-[11px] text-[var(--admin-muted)]" dir="ltr">
          {session.role}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Link
          href="/app"
          className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-center text-xs font-semibold text-[var(--admin-primary)]"
        >
          {t.auth.openApp}
        </Link>
        <button
          type="button"
          disabled={isSigningOut}
          onClick={() => { void handleLogout(); }}
          className="rounded-lg bg-[#F3F4F6] px-3 py-2 text-xs font-semibold text-[var(--admin-danger)] disabled:opacity-50"
        >
          {isSigningOut ? t.auth.signingOut : t.auth.signOut}
        </button>
      </div>
      <p className="text-[11px] text-[var(--admin-muted)]">{t.readOnlyFooter}</p>
      <ReleaseVersionLine
        className="text-center text-[11px] font-semibold text-[var(--admin-muted)] lg:text-start"
        lang={locale}
        showBuild
      />
    </div>
  );
}
