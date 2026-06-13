"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { LanguageToggle } from "@/features/saas-admin/components/LanguageToggle";
import {
  SaasAdminLocaleProvider,
  useSaasAdminLocale,
} from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";
import type { SaasAdminLocale } from "@/features/saas-admin/i18n/translations";
import { requestPlatformAdminPasswordResetViaApi } from "@/features/saas-admin/client/saas-admin-api-client";
import { AdminCard } from "@/features/saas-admin/components/AdminCard";
import { usePasswordResetEnabled } from "@/features/auth/client/use-password-reset-enabled";
import "@/features/saas-admin/components/admin-theme.css";
import { ReleaseVersionLine } from "@/release/ReleaseVersionLine";

function ForgotPasswordForm() {
  const { locale, t, dir } = useSaasAdminLocale();
  const { enabled, loading } = usePasswordResetEnabled();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      const result = await requestPlatformAdminPasswordResetViaApi({ email: email.trim() });
      setSuccess(
        typeof result?.message === "string"
          ? result.message
          : t.auth.forgotPasswordSuccess,
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t.auth.forgotPasswordError);
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
          <h1 className="mt-1 text-xl font-bold text-[var(--admin-primary)]">{t.auth.forgotPasswordTitle}</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--admin-muted)]">{t.auth.forgotPasswordDescription}</p>

          {loading ? (
            <p className="mt-6 text-sm text-[var(--admin-muted)]">{t.auth.forgotPasswordChecking}</p>
          ) : null}

          {!loading && !enabled ? (
            <p className="mt-6 rounded-lg bg-[var(--admin-surface-muted)] p-3 text-sm text-[var(--admin-muted)]">
              {t.auth.forgotPasswordDisabled}
            </p>
          ) : null}

          {!loading && enabled ? (
            <form onSubmit={(event) => { void handleSubmit(event); }} className="mt-6 space-y-4">
              <label className="block space-y-1 text-sm">
                <span className="text-[var(--admin-muted)]">{t.auth.email}</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
                  dir="ltr"
                  autoComplete="email"
                />
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-[var(--admin-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isSubmitting ? t.auth.forgotPasswordSending : t.auth.forgotPasswordSubmit}
              </button>
            </form>
          ) : null}

          {success ? <p className="mt-3 text-sm text-[var(--admin-success,#257844)]">{success}</p> : null}
          {error ? <p className="mt-3 text-sm text-[var(--admin-danger)]">{error}</p> : null}

          <p className="mt-4 text-center text-sm text-[var(--admin-muted)]">
            <Link href="/saas-admin/login" className="font-semibold text-[var(--admin-primary)]">
              {t.auth.backToLogin}
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

export function SaasAdminForgotPasswordPage({ initialLocale = "ar" }: { initialLocale?: SaasAdminLocale }) {
  return (
    <SaasAdminLocaleProvider initialLocale={initialLocale}>
      <ForgotPasswordForm />
    </SaasAdminLocaleProvider>
  );
}
