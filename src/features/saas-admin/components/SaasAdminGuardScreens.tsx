"use client";

import "@/features/saas-admin/components/admin-theme.css";
import { LanguageToggle } from "@/features/saas-admin/components/LanguageToggle";
import {
  SaasAdminLocaleProvider,
  useSaasAdminLocale,
} from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";
import type { SaasAdminLocale } from "@/features/saas-admin/i18n/translations";

function GuardFrame({ children }: { children: React.ReactNode }) {
  const { dir } = useSaasAdminLocale();
  return (
    <main
      dir={dir}
      className="saas-admin-root flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6"
    >
      <LanguageToggle />
      {children}
    </main>
  );
}

function DisabledContent() {
  const { t } = useSaasAdminLocale();
  return (
    <section className="max-w-xl rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-8 text-center shadow-sm">
      <h1 className="text-lg font-bold text-[var(--admin-primary)]">{t.guard.disabledTitle}</h1>
      <p className="mt-3 text-sm leading-7 text-[var(--admin-muted)]">{t.guard.disabledBody}</p>
    </section>
  );
}

function UnauthorizedContent() {
  const { t } = useSaasAdminLocale();
  return (
    <section className="max-w-xl rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-8 text-center shadow-sm">
      <h1 className="text-lg font-bold text-[var(--admin-primary)]">{t.guard.unauthorizedTitle}</h1>
      <p className="mt-3 text-sm leading-7 text-[var(--admin-muted)]">{t.guard.unauthorizedBody}</p>
    </section>
  );
}

function UnauthenticatedContent() {
  const { t } = useSaasAdminLocale();
  return (
    <section className="max-w-xl rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-8 text-center shadow-sm">
      <h1 className="text-lg font-bold text-[var(--admin-primary)]">{t.guard.unauthenticatedTitle}</h1>
      <p className="mt-3 text-sm leading-7 text-[var(--admin-muted)]">{t.guard.unauthenticatedBody}</p>
    </section>
  );
}

type GuardScreenProps = {
  initialLocale?: SaasAdminLocale;
};

export function SaasAdminDisabledScreen({ initialLocale = "ar" }: GuardScreenProps) {
  return (
    <SaasAdminLocaleProvider initialLocale={initialLocale}>
      <GuardFrame><DisabledContent /></GuardFrame>
    </SaasAdminLocaleProvider>
  );
}

export function SaasAdminUnauthorizedScreen({ initialLocale = "ar" }: GuardScreenProps) {
  return (
    <SaasAdminLocaleProvider initialLocale={initialLocale}>
      <GuardFrame><UnauthorizedContent /></GuardFrame>
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
