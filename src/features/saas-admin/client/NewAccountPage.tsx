"use client";

import Link from "next/link";
import { AccountCreatedSuccessPanel } from "@/features/saas-admin/client/AccountCreatedSuccessPanel";
import { AdminErrorAlert } from "@/features/saas-admin/components/AdminErrorAlert";
import { AdminHeader } from "@/features/saas-admin/components/AdminHeader";
import { AdminPageBody } from "@/features/saas-admin/components/AdminPageBody";
import { useNewAccountForm } from "@/features/saas-admin/client/use-new-account-form";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

export default function NewAccountPage() {
  const { locale, t } = useSaasAdminLocale();
  const form = useNewAccountForm(t);

  return (
    <>
      <AdminHeader
        title={t.newAccount.title}
        description={t.newAccount.description}
        actions={(
          <Link
            href="/saas-admin/accounts"
            className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm font-semibold text-[var(--admin-primary)]"
          >
            {t.common.backToAccounts}
          </Link>
        )}
      />
      <AdminPageBody className="mx-auto max-w-2xl">
        {form.createdAccount ? (
          <AccountCreatedSuccessPanel created={form.createdAccount} />
        ) : (
          <form onSubmit={form.handleSubmit} className="space-y-5 rounded-xl border border-[var(--admin-border)] bg-white p-4 sm:p-6">
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-[var(--admin-text)]">{t.newAccount.sectionOrganization}</h2>
              <label className="block space-y-1 text-sm">
                <span className="text-[var(--admin-muted)]">{t.newAccount.organizationName}</span>
                <input
                  required
                  value={form.organizationName}
                  onChange={(e) => form.setOrganizationName(e.target.value)}
                  className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-[var(--admin-muted)]">{t.newAccount.planCode}</span>
                <select
                  value={form.planCode}
                  onChange={(e) => form.setPlanCode(e.target.value as typeof form.planCode)}
                  className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
                >
                  {(form.planOptions.length > 0 ? form.planOptions : [
                    { planCode: "starter", displayNameAr: t.plans.starter, displayNameEn: t.plans.starter },
                    { planCode: "growth", displayNameAr: t.plans.growth, displayNameEn: t.plans.growth },
                    { planCode: "enterprise", displayNameAr: t.plans.enterprise, displayNameEn: t.plans.enterprise },
                  ]).map((plan) => (
                    <option key={plan.planCode} value={plan.planCode}>
                      {locale === "ar" ? plan.displayNameAr : plan.displayNameEn}
                    </option>
                  ))}
                </select>
              </label>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-[var(--admin-text)]">{t.newAccount.sectionOwner}</h2>
              <label className="block space-y-1 text-sm">
                <span className="text-[var(--admin-muted)]">{t.newAccount.ownerName}</span>
                <input
                  required
                  value={form.ownerName}
                  onChange={(e) => form.setOwnerName(e.target.value)}
                  className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-[var(--admin-muted)]">{t.newAccount.ownerPhone}</span>
                <input
                  required
                  value={form.ownerPhone}
                  onChange={(e) => form.setOwnerPhone(e.target.value)}
                  placeholder={t.newAccount.ownerPhonePlaceholder}
                  className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
                  dir="ltr"
                />
              </label>
              <p className="text-xs text-[var(--admin-muted)]">{t.newAccount.setupLinkHint}</p>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-[var(--admin-text)]">{t.newAccount.sectionStore}</h2>
              <label className="block space-y-1 text-sm">
                <span className="text-[var(--admin-muted)]">{t.newAccount.storeName}</span>
                <input
                  value={form.storeName}
                  onChange={(e) => form.setStoreName(e.target.value)}
                  placeholder={t.newAccount.storeNamePlaceholder}
                  className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-[var(--admin-muted)]">{t.newAccount.storeLocation}</span>
                <input
                  value={form.storeLocation}
                  onChange={(e) => form.setStoreLocation(e.target.value)}
                  className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
                />
              </label>
            </section>

            {form.error ? (
              <AdminErrorAlert message={form.error.message} cause={form.error.cause} code={form.error.code} />
            ) : null}

            <button
              type="submit"
              disabled={form.isSubmitting}
              className="rounded-lg bg-[var(--admin-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {form.isSubmitting ? t.newAccount.submitting : t.newAccount.submit}
            </button>
          </form>
        )}
      </AdminPageBody>
    </>
  );
}
