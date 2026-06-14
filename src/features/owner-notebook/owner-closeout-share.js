import { shareImageThroughWhatsApp } from "@/features/daily-closeouts/notebook-image-sharing";

function normalizedStoreLabel(storeName, lang) {
  const normalized = String(storeName || "").trim();
  if (lang === "ar") {
    return normalized.replace(/^(?:المحل|محل)\s+/u, "").trim();
  }
  return normalized;
}

function periodScopePhrase(lang, period, periodLabel) {
  const label = String(periodLabel || "").trim();
  if (!label) return "";
  switch (period) {
    case "month":
      return lang === "ar" ? `لشهر ${label}` : `for ${label}`;
    case "year":
      return lang === "ar" ? `لسنة ${label}` : `for ${label}`;
    case "custom":
      return lang === "ar" ? `للفترة ${label}` : `for ${label}`;
    case "day":
    default:
      return lang === "ar" ? `ليوم ${label}` : `for ${label}`;
  }
}

/**
 * WhatsApp caption for owner closeout image share.
 * Example (ar/day): تقفيلة محل ARZ ليوم 13-06-2026
 */
export function buildOwnerCloseoutShareCaption({
  lang = "ar",
  storeName = "",
  period = "day",
  periodLabel = "",
  combined = false,
  reportKind = "",
}) {
  const scope = periodScopePhrase(lang, period, periodLabel);
  if (combined) {
    return lang === "ar"
      ? `تقفيلة مقارنة المحلات ${scope}`.trim()
      : `Stores closeout ${scope}`.trim();
  }

  const storeLabel = normalizedStoreLabel(storeName, lang);
  const reportPrefixes = {
    outflow: lang === "ar" ? "تقرير الخارج" : "Outflow report",
    channels: lang === "ar" ? "تقرير القنوات" : "Channels report",
    days: lang === "ar" ? "تقرير الأيام" : "Days report",
    proofs: lang === "ar" ? "تقرير المرفقات" : "Attachments report",
  };
  const reportPrefix = reportPrefixes[reportKind] || "";

  if (reportPrefix) {
    if (lang === "ar") {
      return storeLabel
        ? `${reportPrefix} لمحل ${storeLabel} ${scope}`.trim()
        : `${reportPrefix} ${scope}`.trim();
    }
    return storeLabel
      ? `${reportPrefix} for ${storeLabel} ${scope}`.trim()
      : `${reportPrefix} ${scope}`.trim();
  }

  if (lang === "ar") {
    return storeLabel
      ? `تقفيلة محل ${storeLabel} ${scope}`.trim()
      : `تقفيلة ${scope}`.trim();
  }
  return storeLabel
    ? `Closeout for ${storeLabel} ${scope}`.trim()
    : `Closeout ${scope}`.trim();
}

export async function shareOwnerCloseoutImage({ file, caption, lang }) {
  return shareImageThroughWhatsApp({
    file,
    caption,
    title: lang === "ar" ? "تقفيلة" : "Taqfeelah",
    allowFileOnlyFallback: false,
  });
}
