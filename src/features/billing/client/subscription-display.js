import { halalasToSar } from "@/features/billing/client/plan-price-utils";

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

export function formatPlanPriceLabel(priceMonthlyHalalas, lang, { isTrialPlan = false } = {}) {
  if (isTrialPlan) {
    return lang === "ar" ? "مجاني — خطة تجريبية" : "Free — trial plan";
  }
  if (!priceMonthlyHalalas) {
    return lang === "ar" ? "حسب الطلب" : "Custom pricing";
  }
  const amount = halalasToSar(priceMonthlyHalalas);
  return lang === "ar" ? `${amount} ر.س / شهر` : `SAR ${amount} / month`;
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
  return date.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTrialDaysRemainingLabel(daysRemaining, lang) {
  if (daysRemaining == null) {
    return lang === "ar" ? "غير محدد" : "Not set";
  }
  if (daysRemaining <= 0) {
    return lang === "ar" ? "انتهت التجربة" : "Trial ended";
  }
  if (daysRemaining === 1) {
    return lang === "ar" ? "يوم واحد متبقٍ" : "1 day left";
  }
  return lang === "ar" ? `${daysRemaining} يوم متبقٍ` : `${daysRemaining} days left`;
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
