"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { parsePlanCode, type PlanCode } from "@/features/billing/plan-codes";
import { updateSaasAccountSubscription } from "@/features/saas-admin/client/saas-admin-api-client";
import { usePlanCatalogAdmin } from "@/features/billing/client/use-plan-catalog-admin";
import { mapSaasAdminApiError } from "@/features/saas-admin/client/api-error";
import { formatPlanCode } from "@/features/saas-admin/components/admin-display-labels";
import { formatDateTime, formatNumber } from "@/features/saas-admin/components/format-utils";
import { AdminCallout } from "@/features/saas-admin/components/AdminCallout";
import { AdminCard } from "@/features/saas-admin/components/AdminCard";
import { StatusBadge } from "@/features/saas-admin/components/StatusBadge";
import type {
  AccountStatus,
  SaasAccountSubscriptionSnapshot,
} from "@/features/saas-admin/types";
import type { ResolvedOrganizationEntitlements } from "@/features/billing/types";
import { useSaasAdminLocale } from "@/features/saas-admin/i18n/SaasAdminLocaleProvider";

type AccountSubscriptionPanelProps = {
  organizationId: string;
  subscription: SaasAccountSubscriptionSnapshot | null;
  entitlements: ResolvedOrganizationEntitlements | null;
  displayStatus: AccountStatus;
  onUpdated: () => void;
};

function formatPriceHalalas(halalas: number, locale: "ar" | "en", currencyLabel: string): string {
  const amount = formatNumber(halalas / 100, locale);
  return `${amount} ${currencyLabel}`;
}

function usagePercent(used: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.round((used / max) * 100));
}

export function AccountSubscriptionPanel({
  organizationId,
  subscription,
  entitlements,
  displayStatus,
  onUpdated,
}: AccountSubscriptionPanelProps) {
  const { locale, t } = useSaasAdminLocale();
  const { plans, isLoading: plansLoading } = usePlanCatalogAdmin();
  const activePlans = useMemo(
    () => plans.filter((plan) => plan.isActive).sort((left, right) => left.sortOrder - right.sortOrder),
    [plans],
  );

  const currentPlanCode = parsePlanCode(subscription?.planCode) ?? parsePlanCode(entitlements?.planCode) ?? "trial";
  const [selectedPlan, setSelectedPlan] = useState<PlanCode>(currentPlanCode);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    subscription?.billingCycle === "yearly" ? "yearly" : "monthly",
  );
  const [subscriptionStatus, setSubscriptionStatus] = useState(
    subscription?.status ?? "trialing",
  );
  const [extendDays, setExtendDays] = useState("14");
  const [acknowledgeLimits, setAcknowledgeLimits] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedPlan(currentPlanCode);
    setBillingCycle(subscription?.billingCycle === "yearly" ? "yearly" : "monthly");
    setSubscriptionStatus(subscription?.status ?? "trialing");
    setAcknowledgeLimits(false);
  }, [currentPlanCode, subscription?.billingCycle, subscription?.status]);

  const selectedCatalogPlan = activePlans.find((plan) => plan.planCode === selectedPlan);
  const currentCatalogPlan = activePlans.find((plan) => plan.planCode === currentPlanCode);
  const isDowngradeSelection = selectedCatalogPlan && currentCatalogPlan
    ? selectedCatalogPlan.sortOrder < currentCatalogPlan.sortOrder
    : false;

  const seatUsage = entitlements
    ? entitlements.usage.activeEmployees + entitlements.usage.pendingInvitations
    : 0;
  const exceedsSelectedLimits = selectedCatalogPlan
    ? entitlements && (
        entitlements.usage.activeStores > selectedCatalogPlan.maxStores
        || seatUsage > selectedCatalogPlan.maxEmployees
      )
    : false;

  async function submitUpdate(payload: Parameters<typeof updateSaasAccountSubscription>[1]) {
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      const result = await updateSaasAccountSubscription(organizationId, payload);
      setSuccess(
        result.changeType === "upgrade"
          ? t.subscription.upgradeSuccess
          : result.changeType === "downgrade"
            ? t.subscription.downgradeSuccess
            : t.subscription.updateSuccess,
      );
      onUpdated();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? mapSaasAdminApiError(submitError, t) || t.subscription.updateError
          : t.subscription.updateError,
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleQuickUpgrade(planCode: PlanCode) {
    await submitUpdate({
      planCode,
      activatePaid: true,
      billingCycle: "monthly",
    });
  }

  async function handleActivatePaid() {
    const paidPlan = entitlements?.upgradePlans[0]?.planCode ?? "starter";
    await submitUpdate({
      planCode: paidPlan,
      activatePaid: true,
      billingCycle,
    });
  }

  async function handleExtendTrial() {
    const days = Number.parseInt(extendDays, 10);
    if (!Number.isFinite(days) || days < 1) {
      setError(t.subscription.invalidExtendDays);
      return;
    }
    await submitUpdate({ extendPeriodDays: days });
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isDowngradeSelection && exceedsSelectedLimits && !acknowledgeLimits) {
      setError(t.subscription.downgradeConfirmRequired);
      return;
    }

    const days = extendDays.trim() ? Number.parseInt(extendDays, 10) : undefined;
    await submitUpdate({
      planCode: selectedPlan !== currentPlanCode ? selectedPlan : undefined,
      status: subscriptionStatus !== subscription?.status ? subscriptionStatus as "trialing" | "active" | "past_due" | "canceled" : undefined,
      billingCycle: billingCycle !== subscription?.billingCycle ? billingCycle : undefined,
      extendPeriodDays: days && Number.isFinite(days) ? days : undefined,
      acknowledgeUsageExceedsLimits: acknowledgeLimits || undefined,
    });
  }

  if (!subscription || !entitlements) {
    return (
      <AdminCard padding="md">
        <p className="text-sm text-[var(--admin-muted)]">{t.subscription.missingData}</p>
      </AdminCard>
    );
  }

  const storesUsed = entitlements.usage.activeStores;
  const employeesUsed = seatUsage;

  return (
    <div className="space-y-4">
      <AdminCard padding="md" className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--admin-text)]">{t.subscription.title}</h3>
            <p className="mt-1 text-xs leading-6 text-[var(--admin-muted)]">{t.subscription.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={displayStatus} />
            <span className="rounded-full bg-[var(--admin-surface-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--admin-text)]">
              {formatPlanCode(entitlements.planCode, t)}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-[var(--admin-border)] px-3 py-2">
            <p className="text-xs text-[var(--admin-muted)]">{t.subscription.statusLabel}</p>
            <p className="mt-1 text-sm font-semibold text-[var(--admin-text)]">{subscription.status}</p>
          </div>
          <div className="rounded-lg border border-[var(--admin-border)] px-3 py-2">
            <p className="text-xs text-[var(--admin-muted)]">{t.subscription.billingCycle}</p>
            <p className="mt-1 text-sm font-semibold text-[var(--admin-text)]">
              {subscription.billingCycle === "yearly" ? t.subscription.yearly : t.subscription.monthly}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--admin-border)] px-3 py-2">
            <p className="text-xs text-[var(--admin-muted)]">{t.subscription.periodEnd}</p>
            <p className="mt-1 text-sm font-semibold text-[var(--admin-text)]">
              {formatDateTime(subscription.currentPeriodEnd, locale)}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--admin-border)] px-3 py-2">
            <p className="text-xs text-[var(--admin-muted)]">{t.subscription.monthlyPrice}</p>
            <p className="mt-1 text-sm font-semibold text-[var(--admin-text)]">
              {formatPriceHalalas(entitlements.priceMonthlyHalalas, locale, t.common.currencySar)}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--admin-muted)]">
              <span>{t.subscription.storesUsage}</span>
              <span>{formatNumber(storesUsed, locale)} / {formatNumber(entitlements.maxStores, locale)}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-[var(--admin-surface-muted)]">
              <div
                className="h-2 rounded-full bg-[var(--admin-primary)]"
                style={{ width: `${usagePercent(storesUsed, entitlements.maxStores)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--admin-muted)]">
              <span>{t.subscription.employeesUsage}</span>
              <span>{formatNumber(employeesUsed, locale)} / {formatNumber(entitlements.maxEmployees, locale)}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-[var(--admin-surface-muted)]">
              <div
                className="h-2 rounded-full bg-[var(--admin-primary)]"
                style={{ width: `${usagePercent(employeesUsed, entitlements.maxEmployees)}%` }}
              />
            </div>
          </div>
        </div>

        {entitlements.isTrialPlan ? (
          <AdminCallout tone="info">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm">{t.subscription.trialBanner}</p>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => { void handleActivatePaid(); }}
                className="rounded-lg bg-[var(--admin-primary)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {t.subscription.activatePaid}
              </button>
            </div>
          </AdminCallout>
        ) : null}

        {entitlements.upgradePlans.length ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
              {t.subscription.quickUpgrade}
            </p>
            <div className="flex flex-wrap gap-2">
              {entitlements.upgradePlans.map((plan) => (
                <button
                  key={plan.planCode}
                  type="button"
                  disabled={isSaving}
                  onClick={() => { void handleQuickUpgrade(plan.planCode); }}
                  className="rounded-lg border border-[var(--admin-border)] bg-white px-3 py-2 text-left text-xs shadow-sm transition hover:border-[var(--admin-primary)] disabled:opacity-50"
                >
                  <span className="block font-semibold text-[var(--admin-text)]">
                    {locale === "ar" ? plan.displayNameAr : plan.displayNameEn}
                  </span>
                  <span className="mt-0.5 block text-[var(--admin-muted)]">
                    {formatPriceHalalas(plan.priceMonthlyHalalas, locale, t.common.currencySar)}
                    {" "}
                    {t.subscription.perMonth}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </AdminCard>

      <AdminCard as="form" padding="md" className="space-y-3" onSubmit={handleFormSubmit}>
        <h3 className="text-sm font-semibold text-[var(--admin-text)]">{t.subscription.manualTitle}</h3>
        <p className="text-xs leading-6 text-[var(--admin-muted)]">{t.subscription.manualDescription}</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className="text-[var(--admin-muted)]">{t.common.plan}</span>
            <select
              value={selectedPlan}
              disabled={plansLoading}
              onChange={(e) => {
                setSelectedPlan(e.target.value as PlanCode);
                setAcknowledgeLimits(false);
              }}
              className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
            >
              {activePlans.map((plan) => (
                <option key={plan.planCode} value={plan.planCode}>
                  {locale === "ar" ? plan.displayNameAr : plan.displayNameEn}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-[var(--admin-muted)]">{t.subscription.statusLabel}</span>
            <select
              value={subscriptionStatus}
              onChange={(e) => setSubscriptionStatus(e.target.value)}
              className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
            >
              <option value="trialing">{t.subscription.statusTrialing}</option>
              <option value="active">{t.subscription.statusActive}</option>
              <option value="past_due">{t.subscription.statusPastDue}</option>
              <option value="canceled">{t.subscription.statusCanceled}</option>
            </select>
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-[var(--admin-muted)]">{t.subscription.billingCycle}</span>
            <select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as "monthly" | "yearly")}
              className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
            >
              <option value="monthly">{t.subscription.monthly}</option>
              <option value="yearly">{t.subscription.yearly}</option>
            </select>
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-[var(--admin-muted)]">{t.subscription.extendDays}</span>
            <input
              value={extendDays}
              onChange={(e) => setExtendDays(e.target.value)}
              inputMode="numeric"
              className="w-full rounded-lg border border-[var(--admin-border)] px-3 py-2"
              placeholder="14"
            />
          </label>
        </div>

        {isDowngradeSelection && exceedsSelectedLimits ? (
          <AdminCallout tone="warning">
            <p className="text-sm">{t.subscription.downgradeWarning}</p>
            <label className="mt-2 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={acknowledgeLimits}
                onChange={(e) => setAcknowledgeLimits(e.target.checked)}
                className="mt-1"
              />
              <span>{t.subscription.downgradeAcknowledge}</span>
            </label>
          </AdminCallout>
        ) : null}

        {error ? <AdminCallout tone="danger">{error}</AdminCallout> : null}
        {success ? <AdminCallout tone="info">{success}</AdminCallout> : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-[var(--admin-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSaving ? t.subscription.saving : t.subscription.saveChanges}
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => { void handleExtendTrial(); }}
            className="rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-semibold text-[var(--admin-primary)] disabled:opacity-50"
          >
            {t.subscription.extendTrialAction}
          </button>
        </div>
      </AdminCard>
    </div>
  );
}
