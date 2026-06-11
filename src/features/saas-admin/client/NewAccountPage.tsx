"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminHeader } from "@/features/saas-admin/components/AdminHeader";
import { createSaasAccount } from "@/features/saas-admin/client/saas-admin-api-client";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

export default function NewAccountPage() {
  const { t } = useSaasAdminLocale();
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerUsername, setOwnerUsername] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeLocation, setStoreLocation] = useState("");
  const [planCode, setPlanCode] = useState<"starter" | "growth" | "enterprise">("starter");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const created = await createSaasAccount({
        organizationName,
        ownerName,
        ownerUsername,
        ownerPassword,
        storeName: storeName || undefined,
        storeLocation: storeLocation || undefined,
        planCode,
      });
      router.push(`/saas-admin/accounts/${created.organizationId}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t.newAccount.submitError);
    } finally {
      setIsSubmitting(false);
    }
  }

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
      <div className="mx-auto max-w-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-[var(--admin-border)] bg-white p-6">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--admin-text)]">{t.newAccount.sectionOrganization}</h2>
            <label className="block space-y-1 text-sm">
              <span className="text-[var(--admin-muted)]">{t.newAccount.organizationName}</span>
              <input
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-[var(--admin-muted)]">{t.newAccount.planCode}</span>
              <select
                value={planCode}
                onChange={(e) => setPlanCode(e.target.value as typeof planCode)}
                className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
              >
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </label>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--admin-text)]">{t.newAccount.sectionOwner}</h2>
            <label className="block space-y-1 text-sm">
              <span className="text-[var(--admin-muted)]">{t.newAccount.ownerName}</span>
              <input
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-[var(--admin-muted)]">{t.newAccount.ownerUsername}</span>
              <input
                required
                autoComplete="off"
                value={ownerUsername}
                onChange={(e) => setOwnerUsername(e.target.value)}
                className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
                dir="ltr"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-[var(--admin-muted)]">{t.newAccount.ownerPassword}</span>
              <input
                required
                minLength={4}
                type="password"
                autoComplete="new-password"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
                dir="ltr"
              />
              <span className="text-xs text-[var(--admin-muted)]">{t.newAccount.ownerPasswordHint}</span>
            </label>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--admin-text)]">{t.newAccount.sectionStore}</h2>
            <label className="block space-y-1 text-sm">
              <span className="text-[var(--admin-muted)]">{t.newAccount.storeName}</span>
              <input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder={t.newAccount.storeNamePlaceholder}
                className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-[var(--admin-muted)]">{t.newAccount.storeLocation}</span>
              <input
                value={storeLocation}
                onChange={(e) => setStoreLocation(e.target.value)}
                className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
              />
            </label>
          </section>

          {error ? (
            <p className="text-sm text-[var(--admin-danger)]">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-[var(--admin-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSubmitting ? t.newAccount.submitting : t.newAccount.submit}
          </button>
        </form>
      </div>
    </>
  );
}
