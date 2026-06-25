"use client";

import React from "react";
import { formatOrganizationAccountNumber } from "@/features/billing/client/format-organization-account-number";
import {
  formatBillingCycleLabel,
  formatPeriodEndLabel,
  formatPlanPriceLabel,
  formatRenewalDaysRemainingLabel,
  formatSubscriptionStatusLabel,
  formatSubscriptionStatusTone,
  formatTrialDaysRemainingLabel,
  formatUsageRatio,
  isUsageOverLimit,
  pickLocalizedFeatureLabel,
  pickLocalizedPlanName,
} from "@/features/billing/client/subscription-display";
import { SubscriptionRenewalBanner } from "@/features/billing/client/SubscriptionRenewalBanner";
import { countEmployeeSeats } from "@/features/billing/client/entitlement-guards";
import { text } from "./taqfeelah-app-demo-data";
import { Badge, SettingsPageHeader } from "./owner-settings-ui-primitives";
import { SettingsSectionFrame } from "./owner-settings-section-frame";
import type { DisplayLang, OwnerSettingsSectionCommonProps } from "./taqfeelah-app-types";
import type { ResolvedOrganizationEntitlements } from "@/features/billing/client/billing-client-types";

function SubscriptionUsageMeter({ label, used, max, lang }: { label: React.ReactNode; used: number; max: number; lang: DisplayLang }) {
  const overLimit = isUsageOverLimit(used, max);
  const percent = formatUsageRatio(used, max);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-taq-meta font-bold text-[#716753]">
        <span>{label}</span>
        <span className={overLimit ? "text-[#B44747]" : ""}>{used} / {max}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#F0ECE2]">
        <div
          className={`h-full rounded-full transition-all ${overLimit ? "bg-[#B44747]" : "bg-[#112A46]"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {overLimit ? (
        <p className="text-taq-meta font-bold text-[#B44747]">
          {lang === "ar" ? "تجاوزت حد الخطة الحالية" : "Over current plan limit"}
        </p>
      ) : null}
    </div>
  );
}

export function OwnerSettingsSubscriptionSection({
  lang,
  setSection,
  entitlements,
  entitlementsLoading,
  entitlementsError,
  reloadEntitlements,
  ownerProfile,
  onOpenSupport,
  embedded = false,
  hideUpgradeActions = false,
}: OwnerSettingsSectionCommonProps & {
  entitlements: ResolvedOrganizationEntitlements | null;
  entitlementsLoading: boolean;
  entitlementsError: string;
  reloadEntitlements: () => void | Promise<void>;
  ownerProfile: Record<string, unknown>;
  onOpenSupport?: () => void;
  hideUpgradeActions?: boolean;
}) {
  const planName = pickLocalizedPlanName(entitlements, lang);
  const statusLabel = formatSubscriptionStatusLabel(
    entitlements?.subscriptionStatus || entitlements?.organizationStatus,
    lang,
    { isTrialPlan: Boolean(entitlements?.isTrialPlan) },
  );
  const statusTone = formatSubscriptionStatusTone(
    entitlements?.subscriptionStatus,
    entitlements?.organizationStatus,
  );
  const employeeSeatsUsed = countEmployeeSeats(entitlements?.usage);

  return (
    <SettingsSectionFrame embedded={embedded}>
      {!embedded ? (
        <SettingsPageHeader title={text(lang, "subscriptionDetails")} onBack={() => setSection("home")} lang={lang} />
      ) : null}
      {entitlements ? (
        <SubscriptionRenewalBanner
          lang={lang}
          entitlements={entitlements}
          ownerName={String(ownerProfile?.name || "")}
          className="mb-4"
        />
      ) : null}
      {entitlementsLoading ? (
        <div className="rounded-3xl bg-white p-5 text-center text-taq-meta font-bold text-[#827762] ring-1 ring-black/[0.045]">
          {text(lang, "subscriptionLoading")}
        </div>
      ) : null}
      {entitlementsError ? (
        <div className="mb-4 rounded-3xl bg-[#FFF1EE] p-4 text-center ring-1 ring-black/[0.045]">
          <p className="text-taq-meta font-bold text-[#B44747]">{entitlementsError}</p>
          <button type="button" onClick={() => { void reloadEntitlements(); }} className="mt-3 rounded-2xl bg-[#112A46] px-4 py-2.5 text-taq-meta font-black text-white">
            {text(lang, "retryLoad")}
          </button>
        </div>
      ) : null}
      {entitlements ? (
        <>
          {entitlements.isTrialPlan ? (
            <div className="mb-4 rounded-3xl bg-[#FFF4D2] p-5 ring-1 ring-[#F0D9A2]">
              <Badge tone="warning">{text(lang, "trialPlanBadge")}</Badge>
              <p className="mt-3 text-sm font-black text-[#806528]">{text(lang, "trialPlanTitle")}</p>
              <p className="mt-3 text-taq-meta font-bold text-[#806528]">
                {text(lang, "trialDaysRemaining")}: {formatTrialDaysRemainingLabel(entitlements.trialDaysRemaining, lang)}
              </p>
              {hideUpgradeActions ? (
                <p className="mt-3 text-taq-meta font-bold text-[#806528]">
                  {lang === "ar" ? "لترقية الخطة اضغط اسم خطتك أعلى الإعدادات." : "Tap your plan name at the top of Settings to upgrade."}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="mb-4 rounded-3xl bg-white p-5 ring-1 ring-black/[0.045]">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="navy">{text(lang, "currentPlan")}</Badge>
              {entitlements.isTrialPlan ? <Badge tone="warning">{text(lang, "trialPlanBadge")}</Badge> : null}
              <Badge tone={statusTone}>{statusLabel}</Badge>
            </div>
            <h3 className="mt-4 text-lg font-black">{planName}</h3>
            {Number.isInteger(entitlements.accountNumber) ? (
              <p className="mt-2 text-taq-meta font-bold text-[#827762]" dir="ltr">
                {lang === "ar" ? "رقم الحساب: " : "Account no.: "}
                {formatOrganizationAccountNumber(entitlements.accountNumber)}
              </p>
            ) : null}
            <p className="mt-2 text-taq-meta font-bold leading-6 text-[#716753]">
              {formatPlanPriceLabel(entitlements.priceMonthlyHalalas, lang, {
                isTrialPlan: entitlements.isTrialPlan,
                billingCycle: entitlements.billingCycle,
                priceYearlyHalalas: entitlements.priceYearlyHalalas,
              })}
            </p>
            <p className="mt-2 text-taq-meta font-bold text-[#827762]">
              {text(lang, "billingCycleLabel")}: {formatBillingCycleLabel(entitlements.billingCycle, lang)}
            </p>
            <p className="mt-2 text-taq-meta font-bold text-[#827762]">
              {entitlements.isTrialPlan
                ? `${text(lang, "trialDaysRemaining")}: ${formatTrialDaysRemainingLabel(entitlements.trialDaysRemaining, lang)}`
                : `${text(lang, "renewalDaysRemaining")}: ${formatRenewalDaysRemainingLabel(entitlements.renewalDaysRemaining, lang)}`}
            </p>
            <p className="mt-3 text-taq-meta font-bold text-[#827762]">
              {entitlements.isTrialPlan
                ? `${text(lang, "trialEndsOn")}: ${formatPeriodEndLabel(entitlements.currentPeriodEnd, lang)}`
                : `${text(lang, "renewalDate")}: ${formatPeriodEndLabel(entitlements.currentPeriodEnd, lang)}`}
            </p>
            <div className="mt-5 space-y-4">
              <SubscriptionUsageMeter
                label={lang === "ar" ? "المحلات" : "Stores"}
                used={entitlements.usage.activeStores}
                max={entitlements.maxStores}
                lang={lang}
              />
              <SubscriptionUsageMeter
                label={lang === "ar" ? "الموظفون والدعوات" : "Employees & invites"}
                used={employeeSeatsUsed}
                max={entitlements.maxEmployees}
                lang={lang}
              />
            </div>
          </div>
          <div className="mb-4 rounded-3xl bg-white p-5 ring-1 ring-black/[0.045]">
            <p className="text-xs font-bold text-[#716753]">{text(lang, "planFeatures")}</p>
            <ul className="mt-3 space-y-2">
              {entitlements.features.map((feature) => (
                <li key={feature.key} className="rounded-2xl bg-[#F7F5EF] px-4 py-3 text-taq-meta font-bold text-[#112A46]">
                  {pickLocalizedFeatureLabel(feature, lang)}
                </li>
              ))}
            </ul>
          </div>
          {entitlements.upgradePlans.length && !hideUpgradeActions ? (
            <div className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.045]">
              <p className="text-xs font-bold text-[#716753]">{text(lang, "upgradeOptions")}</p>
              <div className="mt-3 space-y-3">
                {entitlements.upgradePlans.map((plan) => (
                  <div key={plan.planCode} className="rounded-2xl border border-[#F0ECE2] p-4">
                    <div>
                      <p className="text-sm font-black">{lang === "ar" ? plan.displayNameAr : plan.displayNameEn}</p>
                      <p className="mt-1 text-taq-meta font-bold text-[#827762]">
                        {formatPlanPriceLabel(plan.priceMonthlyHalalas, lang)}
                      </p>
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {plan.features.map((feature) => (
                        <li key={`${plan.planCode}-${feature.key}`} className="text-taq-meta font-bold text-[#716753]">
                          • {pickLocalizedFeatureLabel(feature, lang)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {!hideUpgradeActions && !entitlements.upgradePlans.length ? (
            <div className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.045]">
              <button type="button" onClick={onOpenSupport} className="w-full rounded-2xl bg-[#112A46] py-3 text-xs font-black text-white">
                {text(lang, "contactSupport")}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </SettingsSectionFrame>
  );
}
