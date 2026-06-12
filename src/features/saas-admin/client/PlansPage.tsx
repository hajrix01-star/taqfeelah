"use client";

import { FormEvent, useState } from "react";
import { AdminErrorAlert } from "@/features/saas-admin/components/AdminErrorAlert";
import { AdminHeader } from "@/features/saas-admin/components/AdminHeader";
import { AdminPageBody } from "@/features/saas-admin/components/AdminPageBody";
import { LoadingSkeleton } from "@/features/saas-admin/components/LoadingSkeleton";
import { usePlanCatalogAdmin } from "@/features/billing/client/use-plan-catalog-admin";
import type { PlanCatalogRow } from "@/features/billing/types";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

function halalasToSar(halalas: number): string {
  return (halalas / 100).toFixed(2);
}

function sarToHalalas(value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

type PlanEditorProps = {
  plan: PlanCatalogRow;
  saving: boolean;
  onSave: (row: PlanCatalogRow) => Promise<void>;
};

function PlanEditor({ plan, saving, onSave }: PlanEditorProps) {
  const { locale, t } = useSaasAdminLocale();
  const [displayNameAr, setDisplayNameAr] = useState(plan.displayNameAr);
  const [displayNameEn, setDisplayNameEn] = useState(plan.displayNameEn);
  const [priceMonthly, setPriceMonthly] = useState(halalasToSar(plan.priceMonthlyHalalas));
  const [maxStores, setMaxStores] = useState(String(plan.maxStores));
  const [maxEmployees, setMaxEmployees] = useState(String(plan.maxEmployees));
  const [trialDays, setTrialDays] = useState(String(plan.trialDays));
  const [isActive, setIsActive] = useState(plan.isActive);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSave({
      ...plan,
      displayNameAr: displayNameAr.trim(),
      displayNameEn: displayNameEn.trim(),
      priceMonthlyHalalas: sarToHalalas(priceMonthly),
      maxStores: Number(maxStores) || 1,
      maxEmployees: Number(maxEmployees) || 1,
      trialDays: Number(trialDays) || 14,
      isActive,
    });
  }

  return (
    <form
      onSubmit={(event) => { void handleSubmit(event); }}
      className="space-y-3 rounded-xl border border-[var(--admin-border)] bg-white p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--admin-text)]">
          {locale === "ar" ? plan.displayNameAr : plan.displayNameEn}
        </h3>
        <span dir="ltr" className="rounded bg-[var(--admin-surface-muted)] px-2 py-0.5 text-xs font-mono">
          {plan.planCode}
        </span>
      </div>
      <label className="block space-y-1 text-sm">
        <span className="text-[var(--admin-muted)]">{t.plansPage.displayNameAr}</span>
        <input
          required
          value={displayNameAr}
          onChange={(e) => setDisplayNameAr(e.target.value)}
          className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-[var(--admin-muted)]">{t.plansPage.displayNameEn}</span>
        <input
          required
          value={displayNameEn}
          onChange={(e) => setDisplayNameEn(e.target.value)}
          className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
          dir="ltr"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--admin-muted)]">{t.plansPage.priceMonthly}</span>
          <input
            required
            dir="ltr"
            inputMode="decimal"
            value={priceMonthly}
            onChange={(e) => setPriceMonthly(e.target.value)}
            className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--admin-muted)]">{t.plansPage.trialDays}</span>
          <input
            required
            dir="ltr"
            inputMode="numeric"
            value={trialDays}
            onChange={(e) => setTrialDays(e.target.value)}
            className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--admin-muted)]">{t.plansPage.maxStores}</span>
          <input
            required
            dir="ltr"
            inputMode="numeric"
            value={maxStores}
            onChange={(e) => setMaxStores(e.target.value)}
            className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--admin-muted)]">{t.plansPage.maxEmployees}</span>
          <input
            required
            dir="ltr"
            inputMode="numeric"
            value={maxEmployees}
            onChange={(e) => setMaxEmployees(e.target.value)}
            className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <span>{t.plansPage.isActive}</span>
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-[var(--admin-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? t.plansPage.saving : t.plansPage.save}
      </button>
    </form>
  );
}

export default function PlansPage() {
  const { t } = useSaasAdminLocale();
  const { plans, isLoading, error, saveError, savingPlanCode, savePlan } = usePlanCatalogAdmin();

  if (isLoading) return <LoadingSkeleton />;

  return (
    <>
      <AdminHeader title={t.plansPage.title} description={t.plansPage.description} />
      <AdminPageBody className="mx-auto max-w-3xl space-y-4">
        {error ? (
          <AdminErrorAlert
            message={error instanceof Error ? error.message : t.plansPage.loadError}
          />
        ) : null}
        {saveError ? <AdminErrorAlert message={saveError} /> : null}
        {plans.map((plan) => (
          <PlanEditor
            key={plan.planCode}
            plan={plan}
            saving={savingPlanCode === plan.planCode}
            onSave={savePlan}
          />
        ))}
      </AdminPageBody>
    </>
  );
}
