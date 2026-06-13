"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { LanguageToggle } from "@/features/saas-admin/components/LanguageToggle";
import {
  SaasAdminLocaleProvider,
  useSaasAdminLocale,
} from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";
import type { SaasAdminLocale } from "@/features/saas-admin/i18n/translations";
import { loginOwnerSessionViaApi } from "@/features/runtime-settings/client/runtime-session-and-settings-api-client";
import { AdminCard } from "@/features/saas-admin/components/AdminCard";
import "@/features/saas-admin/components/admin-theme.css";
import { ReleaseVersionLine } from "@/release/ReleaseVersionLine";

type SaasAdminLoginPageProps = {
  initialLocale?: SaasAdminLocale;
  nextPath: string;
};

function LoginForm({ nextPath }: { nextPath: string }) {
  const { locale, t, dir } = useSaasAdminLocale();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await loginOwnerSessionViaApi({
        username: username.trim(),
        password,
      });
      window.location.assign(nextPath);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t.auth.loginError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      dir={dir}
      className="saas-admin-root flex min-h-[100dvh] items-center justify-center px-4 py-8 sm:px-6 sm:py-10"
    >
      <div className="w-full max-w-md space-y-4">
        <div className="flex justify-end">
          <LanguageToggle />
        </div>
        <AdminCard as="section" padding="lg">
          <p className="text-xs font-semibold tracking-wide text-[var(--admin-muted)]">{t.brand}</p>
          <h1 className="mt-1 text-xl font-bold text-[var(--admin-primary)]">{t.auth.loginTitle}</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--admin-muted)]">{t.auth.loginDescription}</p>
          <form onSubmit={(event) => { void handleSubmit(event); }} className="mt-6 space-y-4">
            <label className="block space-y-1 text-sm">
              <span className="text-[var(--admin-muted)]">{t.auth.username}</span>
              <input
                required
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
                dir="ltr"
                autoComplete="username"
                inputMode="email"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-[var(--admin-muted)]">{t.auth.password}</span>
              <input
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
                dir="ltr"
                autoComplete="current-password"
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-[var(--admin-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isSubmitting ? t.auth.signingIn : t.auth.signIn}
            </button>
          </form>
          <p className="mt-3 text-center text-sm">
            <Link href="/saas-admin/forgot-password" className="font-semibold text-[var(--admin-primary)]">
              {t.auth.forgotPasswordLink}
            </Link>
          </p>
          {error ? <p className="mt-3 text-sm text-[var(--admin-danger)]">{error}</p> : null}
          <p className="mt-4 text-center text-sm text-[var(--admin-muted)]">
            <Link href="/app" className="font-semibold text-[var(--admin-primary)]">
              {t.auth.backToApp}
            </Link>
          </p>
        </AdminCard>
        <ReleaseVersionLine
          className="text-center text-[11px] font-semibold text-[var(--admin-muted)]"
          lang={locale}
          showBuild
        />
      </div>
    </main>
  );
}

export function SaasAdminLoginPage({ initialLocale = "ar", nextPath }: SaasAdminLoginPageProps) {
  return (
    <SaasAdminLocaleProvider initialLocale={initialLocale}>
      <LoginForm nextPath={nextPath} />
    </SaasAdminLocaleProvider>
  );
}
