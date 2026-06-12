"use client";

import type { PlanCatalogRow } from "@/features/billing/types";
import { usePlanEditorForm } from "@/features/billing/client/use-plan-editor-form";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

type PlanEditorProps = {
  plan: PlanCatalogRow;
  saving: boolean;
  onSave: (row: PlanCatalogRow) => Promise<void>;
};

export function PlanEditor({ plan, saving, onSave }: PlanEditorProps) {
  const { locale, t } = useSaasAdminLocale();
  const form = usePlanEditorForm(plan, onSave);

  return (
    <form
      onSubmit={(event) => { void form.submit(event); }}
      className="space-y-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4"
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
          value={form.displayNameAr}
          onChange={(e) => form.setDisplayNameAr(e.target.value)}
          className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-[var(--admin-muted)]">{t.plansPage.displayNameEn}</span>
        <input
          required
          value={form.displayNameEn}
          onChange={(e) => form.setDisplayNameEn(e.target.value)}
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
            value={form.priceMonthly}
            onChange={(e) => form.setPriceMonthly(e.target.value)}
            className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--admin-muted)]">{t.plansPage.trialDays}</span>
          <input
            required
            dir="ltr"
            inputMode="numeric"
            value={form.trialDays}
            onChange={(e) => form.setTrialDays(e.target.value)}
            className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--admin-muted)]">{t.plansPage.maxStores}</span>
          <input
            required
            dir="ltr"
            inputMode="numeric"
            value={form.maxStores}
            onChange={(e) => form.setMaxStores(e.target.value)}
            className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="text-[var(--admin-muted)]">{t.plansPage.maxEmployees}</span>
          <input
            required
            dir="ltr"
            inputMode="numeric"
            value={form.maxEmployees}
            onChange={(e) => form.setMaxEmployees(e.target.value)}
            className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => form.setIsActive(e.target.checked)}
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
