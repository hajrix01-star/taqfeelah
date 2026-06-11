import type { SaasAdminLocale } from "@/features/saas-admin/i18n/translations";

function resolveIntlLocale(locale: SaasAdminLocale): string {
  return locale === "en" ? "en-US" : "ar-SA";
}

export function formatNumber(
  value: number | null | undefined,
  locale: SaasAdminLocale = "ar",
): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat(resolveIntlLocale(locale)).format(value);
}

export function formatDateTime(
  value: string | null | undefined,
  locale: SaasAdminLocale = "ar",
): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ك.ب`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} ج.ب`;
}

export function formatMetricValue(
  value: number | null,
  availability: "available" | "estimated" | "unavailable",
  suffix = "",
  locale: SaasAdminLocale = "ar",
  labels?: { unavailable: string; estimated: string },
): string {
  const unavailableLabel = labels?.unavailable ?? "غير متاح";
  const estimatedLabel = labels?.estimated ?? "تقديري";
  if (availability === "unavailable" || value === null) return unavailableLabel;
  const formatted = formatNumber(value, locale);
  if (availability === "estimated") return `${formatted}${suffix} (${estimatedLabel})`;
  return `${formatted}${suffix}`;
}
