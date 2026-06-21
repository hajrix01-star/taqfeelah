import { shareImageThroughWhatsApp } from "@/features/daily-closeouts/notebook-image-sharing";
import type { DisplayLang } from "@/core/i18n/display-locale";

function normalizedStoreLabel(storeName: string, lang: DisplayLang) {
  const normalized = String(storeName || "").trim();
  if (lang === "ar") {
    return normalized.replace(/^(?:المحل|محل)\s+/u, "").trim();
  }
  return normalized;
}

function periodScopePhrase(lang: DisplayLang, period: string, periodLabel: string) {
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

const REPORT_PREFIXES: Record<string, { ar: string; en: string }> = {
  outflow: { ar: "تقرير الخارج", en: "Outflow report" },
  channels: { ar: "تقرير القنوات", en: "Channels report" },
  days: { ar: "تقرير الأيام", en: "Days report" },
  proofs: { ar: "تقرير المرفقات", en: "Attachments report" },
};

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
}: {
  lang?: DisplayLang;
  storeName?: string;
  period?: string;
  periodLabel?: string;
  combined?: boolean;
  reportKind?: string;
}) {
  const scope = periodScopePhrase(lang, period, periodLabel);
  if (combined) {
    return lang === "ar"
      ? `تقفيلة مقارنة المحلات ${scope}`.trim()
      : `Stores closeout ${scope}`.trim();
  }

  const storeLabel = normalizedStoreLabel(storeName, lang);
  const reportPrefix = REPORT_PREFIXES[reportKind]?.[lang] || "";

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

export async function shareOwnerCloseoutImage({
  file,
  caption,
  lang,
}: {
  file: File | null;
  caption: string;
  lang: DisplayLang;
}) {
  return shareImageThroughWhatsApp({
    file,
    caption,
    title: lang === "ar" ? "تقفيلة" : "Taqfeelah",
    allowFileOnlyFallback: false,
  });
}
