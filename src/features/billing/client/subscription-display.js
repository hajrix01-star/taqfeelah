import { halalasToSar } from "@/features/billing/client/plan-price-utils";

export function formatSubscriptionStatusLabel(status, lang) {
  const normalized = typeof status === "string" ? status.trim().toLowerCase() : "";
  const labels = {
    ar: {
      trialing: "تجريبي",
      active: "نشط",
      inactive: "غير نشط",
      canceled: "ملغى",
      past_due: "متأخر السداد",
      pending_activation: "بانتظار التفعيل",
      suspended: "موقوف",
    },
    en: {
      trialing: "Trial",
      active: "Active",
      inactive: "Inactive",
      canceled: "Canceled",
      past_due: "Past due",
      pending_activation: "Pending activation",
      suspended: "Suspended",
    },
  };
  const table = labels[lang === "ar" ? "ar" : "en"];
  return table[normalized] || (lang === "ar" ? "غير محدد" : "Unknown");
}

export function formatSubscriptionStatusTone(status, organizationStatus) {
  if (organizationStatus === "suspended") return "warning";
  const normalized = typeof status === "string" ? status.trim().toLowerCase() : "";
  if (normalized === "active" || normalized === "trialing") return "navy";
  if (normalized === "past_due" || normalized === "inactive") return "warning";
  return "neutral";
}

export function formatPlanPriceLabel(priceMonthlyHalalas, lang) {
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

export function pickLocalizedPlanName(entitlements, lang) {
  if (!entitlements) return "";
  return lang === "ar"
    ? entitlements.planDisplayNameAr
    : entitlements.planDisplayNameEn;
}

export function pickLocalizedFeatureLabel(feature, lang) {
  return lang === "ar" ? feature.labelAr : feature.labelEn;
}
