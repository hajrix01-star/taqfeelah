"use client";

import Link from "next/link";
import { useState } from "react";
import "@/features/saas-admin/components/admin-theme.css";
import { LanguageToggle } from "@/features/saas-admin/components/LanguageToggle";
import {
  SaasAdminLocaleProvider,
  useSaasAdminLocale,
} from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";
import type { SaasAdminLocale } from "@/features/saas-admin/i18n/translations";
import { logoutSaasAdminSession } from "@/features/saas-admin/client/saas-admin-session";
import type { SaasAdminSessionView } from "@/features/saas-admin/server/resolve-saas-admin-session-view";

function GuardFrame({ children }: { children: React.ReactNode }) {
  const { dir } = useSaasAdminLocale();
  return (
    <main
      dir={dir}
      className="saas-admin-root flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-4 py-8 sm:px-6"
    >
      <LanguageToggle />
      {children}
    </main>
  );
}

function DisabledContent() {
  const { t } = useSaasAdminLocale();
  return (
    <section className="w-full max-w-xl rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 text-center shadow-sm sm:p-8">
      <h1 className="text-lg font-bold text-[var(--admin-primary)]">{t.guard.disabledTitle}</h1>
      <p className="mt-3 text-sm leading-7 text-[var(--admin-muted)]">{t.guard.disabledBody}</p>
    </section>
  );
}

function UnauthorizedContent({ session }: { session?: SaasAdminSessionView }) {
  const { t } = useSaasAdminLocale();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSwitchAccount() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await logoutSaasAdminSession();
      window.location.assign("/saas-admin/login?next=%2Fsaas-admin%2Foverview");
    } catch {
      setIsSigningOut(false);
    }
  }

  return (
    <section className="w-full max-w-xl rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 text-center shadow-sm sm:p-8">
      <h1 className="text-lg font-bold text-[var(--admin-primary)]">{t.guard.unauthorizedTitle}</h1>
      <p className="mt-3 text-sm leading-7 text-[var(--admin-muted)]">{t.guard.unauthorizedBody}</p>
      {session?.displayName ? (
        <p className="mt-3 text-sm font-semibold text-[var(--admin-text)]">
          {t.auth.signedInAs.replace("{name}", session.displayName)}
        </p>
      ) : null}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          disabled={isSigningOut}
          onClick={() => { void handleSwitchAccount(); }}
          className="rounded-lg bg-[var(--admin-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isSigningOut ? t.auth.signingOut : t.guard.switchAccount}
        </button>
        <Link
          href="/app"
          className="rounded-lg border border-[var(--admin-border)] px-4 py-2.5 text-sm font-semibold text-[var(--admin-primary)]"
        >
          {t.guard.backToApp}
        </Link>
      </div>
    </section>
  );
}

function UnauthenticatedContent() {
  const { t } = useSaasAdminLocale();
  return (
    <section className="w-full max-w-xl rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 text-center shadow-sm sm:p-8">
      <h1 className="text-lg font-bold text-[var(--admin-primary)]">{t.guard.unauthenticatedTitle}</h1>
      <p className="mt-3 text-sm leading-7 text-[var(--admin-muted)]">{t.guard.unauthenticatedBody}</p>
      <Link
        href="/saas-admin/login?next=%2Fsaas-admin%2Foverview"
        className="mt-6 inline-flex rounded-lg bg-[var(--admin-primary)] px-4 py-2.5 text-sm font-semibold text-white"
      >
        {t.guard.signIn}
      </Link>
    </section>
  );
}

type GuardScreenProps = {
  initialLocale?: SaasAdminLocale;
};

type UnauthorizedScreenProps = GuardScreenProps & {
  session?: SaasAdminSessionView;
};

export function SaasAdminDisabledScreen({ initialLocale = "ar" }: GuardScreenProps) {
  return (
    <SaasAdminLocaleProvider initialLocale={initialLocale}>
      <GuardFrame><DisabledContent /></GuardFrame>
    </SaasAdminLocaleProvider>
  );
}

export function SaasAdminUnauthorizedScreen({
  initialLocale = "ar",
  session,
}: UnauthorizedScreenProps) {
  return (
    <SaasAdminLocaleProvider initialLocale={initialLocale}>
      <GuardFrame><UnauthorizedContent session={session} /></GuardFrame>
    </SaasAdminLocaleProvider>
  );
}

export function SaasAdminUnauthenticatedScreen({ initialLocale = "ar" }: GuardScreenProps) {
  return (
    <SaasAdminLocaleProvider initialLocale={initialLocale}>
      <GuardFrame><UnauthenticatedContent /></GuardFrame>
    </SaasAdminLocaleProvider>
  );
}
