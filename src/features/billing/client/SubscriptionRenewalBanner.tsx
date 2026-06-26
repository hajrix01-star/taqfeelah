"use client";

import React from "react";
import { text } from "@/components/taqfeelah-app/taqfeelah-app-catalog-data";
import {
  formatPeriodEndLabel,
  formatRenewalDaysRemainingLabel,
  pickLocalizedPlanName,
  resolveSubscriptionRenewalBanner,
} from "@/features/billing/client/subscription-display";
import { openBillingRenewalSupport } from "@/features/billing/client/billing-upgrade-support";
import type { SubscriptionRenewalBannerProps } from "@/features/billing/client/billing-client-types";

const TONE_CLASS: Record<string, string> = {
  danger: "bg-[#FFF1EE] ring-[#F0C4BC] text-[#B44747]",
  warning: "bg-[#FFF4D2] ring-[#F0D9A2] text-[#806528]",
  info: "bg-[#F6F8FB] ring-[#D9DFE3] text-[#112A46]",
};

export function SubscriptionRenewalBanner({
  lang,
  entitlements,
  ownerName = "",
  organizationName = "",
  onOpenSubscriptionSettings,
  className = "",
}: SubscriptionRenewalBannerProps) {
  const banner = resolveSubscriptionRenewalBanner(entitlements);
  if (!banner) return null;

  const planName = pickLocalizedPlanName(entitlements, lang);
  const periodEndLabel = formatPeriodEndLabel(entitlements.currentPeriodEnd, lang);
  const daysLabel = formatRenewalDaysRemainingLabel(banner.daysRemaining, lang, {
    trialContext: banner.isTrial,
  });

  let title = "";
  let body = "";

  if (banner.key === "expired") {
    title = text(lang, "subscriptionExpiredTitle");
    body = entitlements.isTrialPlan
      ? text(lang, "subscriptionTrialExpiredBody")
      : text(lang, "subscriptionExpiredBody");
  } else if (banner.key === "grace") {
    title = text(lang, "subscriptionGraceTitle");
    body = text(lang, "subscriptionGraceBody").replace(
      "{days}",
      String(entitlements.gracePeriodDays ?? 0),
    );
  } else if (banner.key === "soon14") {
    title = text(lang, "subscriptionRenewalSoon14");
    body = text(lang, "subscriptionRenewalSoonBody")
      .replace("{days}", String(banner.daysRemaining))
      .replace("{date}", periodEndLabel);
  } else if (banner.key === "soon7") {
    title = text(lang, "subscriptionRenewalSoon7");
    body = text(lang, "subscriptionRenewalSoonBody")
      .replace("{days}", String(banner.daysRemaining))
      .replace("{date}", periodEndLabel);
  } else if (banner.key === "soon3") {
    title = text(lang, "subscriptionRenewalSoon3");
    body = text(lang, "subscriptionRenewalSoonBody")
      .replace("{days}", String(banner.daysRemaining))
      .replace("{date}", periodEndLabel);
  }

  const toneClass = TONE_CLASS[banner.tone] || TONE_CLASS.info;

  return (
    <div className={`rounded-3xl p-4 ring-1 ${toneClass} ${className}`.trim()}>
      <p className="text-sm font-black">{title}</p>
      <p className="mt-2 text-taq-meta font-bold leading-6">{body}</p>
      <p className="mt-2 text-taq-meta font-bold">
        {daysLabel}
        {" · "}
        {planName}
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {onOpenSubscriptionSettings ? (
          <button
            type="button"
            onClick={onOpenSubscriptionSettings}
            className="rounded-2xl bg-[#112A46] px-4 py-3 text-xs font-black text-white"
          >
            {text(lang, "openSubscriptionDetails")}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => openBillingRenewalSupport({
            ownerName,
            organizationName,
            planDisplayNameAr: entitlements.planDisplayNameAr,
            planDisplayNameEn: entitlements.planDisplayNameEn,
            billingCycle: entitlements.billingCycle,
            daysUntilEnd: banner.daysRemaining ?? 0,
            periodEndIso: entitlements.currentPeriodEnd || "",
          })}
          className="rounded-2xl border border-current px-4 py-3 text-xs font-black"
        >
          {text(lang, "renewViaWhatsApp")}
        </button>
      </div>
    </div>
  );
}
