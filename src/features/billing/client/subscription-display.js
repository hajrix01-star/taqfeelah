import { halalasToSar } from "@/features/billing/client/plan-price-utils";
import { formatDisplayDateTime } from "@/core/i18n/display-locale";

export function formatSubscriptionStatusLabel(status, lang, { isTrialPlan = false } = {}) {
  const normalized = typeof status === "string" ? status.trim().toLowerCase() : "";
  const labels = {
    ar: {
      trialing: isTrialPlan ? "تجريبي" : "فترة تجريبية",
      active: "نشط",
      inactive: "غير نشط",
      canceled: "ملغى",
      past_due: "متأخر السداد",
      pending_activation: "بانتظار التفعيل",
      suspended: "موقوف",
      archived: "مؤرشف",
    },
    en: {
      trialing: isTrialPlan ? "Trial" : "Trial period",
      active: "Active",
      inactive: "Inactive",
      canceled: "Canceled",
      past_due: "Past due",
      pending_activation: "Pending activation",
      suspended: "Suspended",
      archived: "Archived",
    },
  };
  const table = labels[lang === "ar" ? "ar" : "en"];
  return table[normalized] || (lang === "ar" ? "غير محدد" : "Unknown");
}

export function formatSubscriptionStatusTone(status, organizationStatus) {
  if (organizationStatus === "archived") return "neutral";
  if (organizationStatus === "suspended") return "warning";
  const normalized = typeof status === "string" ? status.trim().toLowerCase() : "";
  if (normalized === "active" || normalized === "trialing") return "navy";
  if (normalized === "past_due" || normalized === "inactive") return "warning";
  return "neutral";
}

export function formatPlanPriceLabel(priceMonthlyHalalas, lang, {
  isTrialPlan = false,
  billingCycle = "monthly",
  priceYearlyHalalas = null,
} = {}) {
  if (isTrialPlan) {
    return lang === "ar" ? "مجاني — خطة تجريبية" : "Free — trial plan";
  }
  if (billingCycle === "yearly" && priceYearlyHalalas) {
    const yearlyAmount = halalasToSar(priceYearlyHalalas);
    return lang === "ar" ? `${yearlyAmount} ر.س / سنة` : `SAR ${yearlyAmount} / year`;
  }
  if (!priceMonthlyHalalas) {
    return lang === "ar" ? "حسب الطلب" : "Custom pricing";
  }
  const amount = halalasToSar(priceMonthlyHalalas);
  return lang === "ar" ? `${amount} ر.س / شهر` : `SAR ${amount} / month`;
}

export function formatBillingCycleLabel(billingCycle, lang) {
  if (billingCycle === "yearly") {
    return lang === "ar" ? "اشتراك سنوي" : "Yearly billing";
  }
  return lang === "ar" ? "اشتراك شهري" : "Monthly billing";
}

export function formatUsageRatio(used, max) {
  if (!Number.isFinite(used) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.min(100, Math.round((used / max) * 100));
}

export function isUsageOverLimit(used, max) {
  return Number.isFinite(used) && Number.isFinite(max) && max > 0 && used > max;
}

export function formatPeriodEndLabel(isoValue, lang) {
  if (!isoValue) return lang === "ar" ? "غير محدد" : "Not set";
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return lang === "ar" ? "غير محدد" : "Not set";
  return formatDisplayDateTime(date, lang, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTrialDaysRemainingLabel(daysRemaining, lang) {
  return formatRenewalDaysRemainingLabel(daysRemaining, lang, { trialContext: true });
}

export function formatRenewalDaysRemainingLabel(daysRemaining, lang, { trialContext = false } = {}) {
  if (daysRemaining == null) {
    return lang === "ar" ? "غير محدد" : "Not set";
  }
  if (daysRemaining <= 0) {
    return trialContext
      ? (lang === "ar" ? "انتهت التجربة" : "Trial ended")
      : (lang === "ar" ? "انتهى الاشتراك" : "Subscription ended");
  }
  if (daysRemaining === 1) {
    return lang === "ar" ? "يوم واحد متبقٍ" : "1 day left";
  }
  return lang === "ar" ? `${daysRemaining} يوم متبقٍ` : `${daysRemaining} days left`;
}

export function resolveSubscriptionRenewalBanner(entitlements) {
  if (!entitlements) return null;

  const days = entitlements.renewalDaysRemaining;
  const phase = entitlements.subscriptionPeriodPhase;
  const isTrial = Boolean(entitlements.isTrialPlan);

  if (phase === "expired" || days === 0) {
    return {
      tone: "danger",
      key: "expired",
      daysRemaining: 0,
    };
  }

  if (phase === "grace") {
    return {
      tone: "warning",
      key: "grace",
      daysRemaining: days ?? 0,
      gracePeriodDays: entitlements.gracePeriodDays,
    };
  }

  if (days == null) return null;

  if (days <= 3) {
    return { tone: "danger", key: "soon3", daysRemaining: days, isTrial };
  }
  if (days <= 7) {
    return { tone: "warning", key: "soon7", daysRemaining: days, isTrial };
  }
  if (days <= 14) {
    return { tone: "info", key: "soon14", daysRemaining: days, isTrial };
  }

  return null;
}

export function formatPlanSubscriptionHomeLabel(entitlements, lang) {
  if (!entitlements) return "";
  const planName = pickLocalizedPlanName(entitlements, lang);
  if (entitlements.isTrialPlan) {
    return lang === "ar" ? "تجربة مجانية" : "Free trial";
  }
  const status = entitlements.subscriptionStatus?.trim().toLowerCase();
  if (status === "trialing") {
    return lang === "ar" ? `${planName} — فترة تجريبية` : `${planName} — trial period`;
  }
  return planName;
}

export function formatPaidPlanTrialPeriodHint(entitlements, lang) {
  if (!entitlements || entitlements.isTrialPlan) return "";
  if (entitlements.subscriptionStatus?.trim().toLowerCase() !== "trialing") return "";
  const planName = pickLocalizedPlanName(entitlements, lang);
  return lang === "ar"
    ? `أنت على الخطة «${planName}» ضمن فترة تجريبية قبل أول فاتورة — وليست خطة التجربة المجانية.`
    : `You are on the "${planName}" plan in a pre-billing trial period — not the free trial plan.`;
}

export function pickLocalizedPlanName(entitlements, lang) {
  if (!entitlements) return "";
  return lang === "ar"
    ? entitlements.planDisplayNameAr
    : entitlements.planDisplayNameEn;
}

export function pickLocalizedFeatureLabel(feature, lang) {
  return lang === "ar" ? feature.labelAr : feature.labelEn;
}
