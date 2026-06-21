"use client";

import React from "react";
import { X } from "lucide-react";
import {
  openBillingUpgradeSupport,
} from "@/features/billing/client/billing-upgrade-support";
import {
  formatPlanPriceLabel,
  pickLocalizedFeatureLabel,
  pickLocalizedPlanName,
} from "@/features/billing/client/subscription-display";
import type {
  OwnerPlanPickerModalProps,
  PlanPickerRow,
  ResolvedOrganizationEntitlements,
} from "@/features/billing/client/billing-client-types";
import type { DisplayLang } from "@/core/i18n/display-locale";
import { Badge } from "@/components/prototype-runtime/owner-settings-ui-primitives";

function buildCurrentPlanRow(
  entitlements: ResolvedOrganizationEntitlements,
  _lang: DisplayLang,
): PlanPickerRow {
  return {
    planCode: entitlements.planCode,
    displayNameAr: entitlements.planDisplayNameAr,
    displayNameEn: entitlements.planDisplayNameEn,
    priceMonthlyHalalas: entitlements.priceMonthlyHalalas,
    priceYearlyHalalas: entitlements.priceYearlyHalalas,
    maxStores: entitlements.maxStores,
    maxEmployees: entitlements.maxEmployees,
    trialDays: entitlements.trialDays,
    features: entitlements.features,
    isCurrent: true,
  };
}

export function OwnerPlanPickerModal({
  lang,
  open,
  onClose,
  entitlements,
  ownerProfile,
  ownerAccount,
}: OwnerPlanPickerModalProps) {
  const [selectedPlanCode, setSelectedPlanCode] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setSelectedPlanCode("");
    }
  }, [open]);

  if (!open || !entitlements) return null;

  const currentPlanName = pickLocalizedPlanName(entitlements, lang);
  const upgradePlans = entitlements.upgradePlans || [];
  const tablePlans = [
    buildCurrentPlanRow(entitlements, lang),
    ...upgradePlans.map((plan): PlanPickerRow => ({ ...plan, isCurrent: false })),
  ];

  const selectedPlan = tablePlans.find((plan) => plan.planCode === selectedPlanCode) || null;
  const canUpgrade = Boolean(
    selectedPlan
    && !selectedPlan.isCurrent
    && selectedPlan.planCode !== entitlements.planCode,
  );

  const handleUpgrade = () => {
    if (!canUpgrade || !selectedPlan) return;
    const targetPlanName = lang === "ar"
      ? selectedPlan.displayNameAr
      : selectedPlan.displayNameEn;
    const organizationName = ownerAccount?.organizationName || "";
    const accountNumber = entitlements.accountNumber ?? ownerAccount?.accountNumber ?? null;

    openBillingUpgradeSupport({
      ownerName: ownerProfile?.name || ownerAccount?.ownerName || "",
      organizationName,
      accountNumber,
      currentPlanName,
      targetPlanName,
    });
    onClose?.();
  };

  const storesLabel = lang === "ar" ? "محلات" : "Stores";
  const employeesLabel = lang === "ar" ? "موظفون" : "Staff";

  return (
    <div
      className="fixed inset-0 z-[220] flex items-end justify-center bg-[#112A46]/45 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="owner-plan-picker-title"
        className="max-h-[88vh] w-full max-w-lg overflow-hidden rounded-t-[20px] bg-[#F8F6F0] shadow-xl sm:rounded-[20px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E8E1D4] px-4 py-3">
          <h2 id="owner-plan-picker-title" className="text-sm font-black text-[#112A46]">
            {lang === "ar" ? "مقارنة الخطط" : "Compare plans"}
          </h2>
          <button
            type="button"
            aria-label={lang === "ar" ? "إغلاق" : "Close"}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#827762] ring-1 ring-black/[0.05]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-3 py-3" style={{ maxHeight: "calc(88vh - 120px)" }}>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tablePlans.map((plan) => {
              const name = lang === "ar" ? plan.displayNameAr : plan.displayNameEn;
              const selected = selectedPlanCode === plan.planCode;
              const isCurrent = plan.isCurrent || plan.planCode === entitlements.planCode;
              return (
                <button
                  key={plan.planCode}
                  type="button"
                  onClick={() => setSelectedPlanCode(plan.planCode)}
                  className={`min-w-[140px] shrink-0 rounded-2xl border p-3 text-start transition ${
                    selected
                      ? "border-[#112A46] bg-white ring-2 ring-[#112A46]/20"
                      : "border-[#E8E1D4] bg-white/90"
                  }`}
                >
                  <div className="mb-2 flex flex-wrap gap-1">
                    {isCurrent ? <Badge tone="navy">{lang === "ar" ? "خطتك" : "Current"}</Badge> : null}
                  </div>
                  <p className="text-xs font-black text-[#112A46]">{name}</p>
                  <p className="mt-2 text-[10px] font-bold leading-5 text-[#716753]">
                    {formatPlanPriceLabel(plan.priceMonthlyHalalas, lang, {
                      isTrialPlan: isCurrent && entitlements.isTrialPlan,
                      billingCycle: entitlements.billingCycle,
                      priceYearlyHalalas: plan.priceYearlyHalalas,
                    })}
                  </p>
                  <p className="mt-1 text-[10px] font-bold text-[#827762]">
                    {storesLabel}: {plan.maxStores} · {employeesLabel}: {plan.maxEmployees}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {(plan.features || []).slice(0, 3).map((feature) => (
                      <li key={feature.key} className="text-[9px] font-bold text-[#827762]">
                        • {pickLocalizedFeatureLabel(feature, lang)}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-[#E8E1D4] px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            disabled={!canUpgrade}
            onClick={handleUpgrade}
            className={`w-full rounded-2xl py-3.5 text-xs font-black text-white ${
              canUpgrade ? "bg-[#112A46]" : "bg-[#B8C0B7]"
            }`}
          >
            {lang === "ar" ? "ترقية — طلب عبر واتساب" : "Upgrade — request via WhatsApp"}
          </button>
        </div>
      </div>
    </div>
  );
}
