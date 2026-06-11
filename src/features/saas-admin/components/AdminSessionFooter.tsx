"use client";

import Link from "next/link";
import { useState } from "react";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";
import { logoutSaasAdminSession } from "@/features/saas-admin/client/saas-admin-session";
import type { SaasAdminSessionView } from "@/features/saas-admin/server/resolve-saas-admin-session-view";
import { ReleaseVersionLine } from "@/release/ReleaseVersionLine";

type AdminSessionFooterProps = {
  session: SaasAdminSessionView;
  variant?: "default" | "sidebar";
};

export function AdminSessionFooter({ session, variant = "default" }: AdminSessionFooterProps) {
  const { locale, t } = useSaasAdminLocale();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isSidebar = variant === "sidebar";

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
    <div className="space-y-2.5">
      <div>
        <p
          className={`text-[11px] font-semibold uppercase tracking-wide ${
            isSidebar ? "text-[var(--admin-sidebar-muted)]" : "text-[var(--admin-muted)]"
          }`}
        >
          {t.auth.sessionLabel}
        </p>
        <p
          className={`mt-0.5 text-sm font-semibold ${
            isSidebar ? "text-[var(--admin-sidebar-text)]" : "text-[var(--admin-text)]"
          }`}
        >
          {signedInLabel}
        </p>
        <p
          className={`mt-0.5 text-[11px] ${isSidebar ? "text-[var(--admin-sidebar-muted)]" : "text-[var(--admin-muted)]"}`}
          dir="ltr"
        >
          {session.role}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Link
          href="/app"
          className={`rounded-lg border px-3 py-2 text-center text-xs font-semibold ${
            isSidebar
              ? "border-[var(--admin-sidebar-border)] text-[var(--admin-sidebar-text)] hover:bg-[var(--admin-sidebar-hover)]"
              : "border-[var(--admin-border)] text-[var(--admin-primary)] hover:bg-[var(--admin-hover)]"
          }`}
        >
          {t.auth.openApp}
        </Link>
        <button
          type="button"
          disabled={isSigningOut}
          onClick={() => { void handleLogout(); }}
          className={`rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
            isSidebar
              ? "bg-[var(--admin-sidebar-surface)] text-red-300 hover:bg-red-950/40"
              : "bg-[var(--admin-hover)] text-[var(--admin-danger)]"
          }`}
        >
          {isSigningOut ? t.auth.signingOut : t.auth.signOut}
        </button>
      </div>
      <p className={`text-[11px] ${isSidebar ? "text-[var(--admin-sidebar-muted)]" : "text-[var(--admin-muted)]"}`}>
        {t.readOnlyFooter}
      </p>
      <ReleaseVersionLine
        className={`text-[11px] font-semibold lg:text-start ${
          isSidebar ? "text-center text-[var(--admin-sidebar-muted)]" : "text-center text-[var(--admin-muted)]"
        }`}
        lang={locale}
        showBuild
      />
    </div>
  );
}
