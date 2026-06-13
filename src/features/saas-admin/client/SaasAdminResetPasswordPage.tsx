"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LanguageToggle } from "@/features/saas-admin/components/LanguageToggle";
import {
  SaasAdminLocaleProvider,
  useSaasAdminLocale,
} from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";
import type { SaasAdminLocale } from "@/features/saas-admin/i18n/translations";
import {
  confirmPlatformAdminPasswordResetViaApi,
  validatePlatformAdminPasswordResetTokenViaApi,
} from "@/features/saas-admin/client/saas-admin-api-client";
import { AdminCard } from "@/features/saas-admin/components/AdminCard";
import "@/features/saas-admin/components/admin-theme.css";
import { ReleaseVersionLine } from "@/release/ReleaseVersionLine";

function ResetPasswordForm({ token }: { token: string }) {
  const { locale, t, dir } = useSaasAdminLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    validatePlatformAdminPasswordResetTokenViaApi(token)
      .then((result) => {
        if (cancelled) return;
        setValid(result?.valid === true);
      })
      .catch(() => {
        if (!cancelled) setValid(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await confirmPlatformAdminPasswordResetViaApi({
        token,
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      });
      router.replace("/saas-admin/login");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t.auth.resetPasswordError);
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
          <h1 className="mt-1 text-xl font-bold text-[var(--admin-primary)]">{t.auth.resetPasswordTitle}</h1>

          {loading ? (
            <p className="mt-6 text-sm text-[var(--admin-muted)]">{t.auth.resetPasswordChecking}</p>
          ) : null}

          {!loading && !valid ? (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-[var(--admin-danger)]">{t.auth.resetPasswordInvalid}</p>
              <Link href="/saas-admin/forgot-password" className="inline-block text-sm font-semibold text-[var(--admin-primary)]">
                {t.auth.forgotPasswordSubmit}
              </Link>
            </div>
          ) : null}

          {!loading && valid ? (
            <form onSubmit={(event) => { void handleSubmit(event); }} className="mt-6 space-y-4">
              <label className="block space-y-1 text-sm">
                <span className="text-[var(--admin-muted)]">{t.auth.password}</span>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
                  dir="ltr"
                  autoComplete="new-password"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-[var(--admin-muted)]">{t.auth.confirmPassword}</span>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
                  dir="ltr"
                  autoComplete="new-password"
                />
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-[var(--admin-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isSubmitting ? t.auth.resetPasswordSaving : t.auth.resetPasswordSubmit}
              </button>
            </form>
          ) : null}

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

export function SaasAdminResetPasswordPage({
  initialLocale = "ar",
  token,
}: {
  initialLocale?: SaasAdminLocale;
  token: string;
}) {
  return (
    <SaasAdminLocaleProvider initialLocale={initialLocale}>
      <ResetPasswordForm token={token} />
    </SaasAdminLocaleProvider>
  );
}
