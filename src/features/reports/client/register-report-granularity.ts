import { text } from "@/components/taqfeelah-app/taqfeelah-app-demo-data";
import type { DisplayLang } from "@/core/i18n/display-locale";
import { formatCalendarDate, formatSelectedMonth } from "./report-period-labels";

export const REGISTER_REPORT_GRANULARITY = {
  DAY: "day",
  MONTH: "month",
} as const;

export type RegisterReportGranularity = typeof REGISTER_REPORT_GRANULARITY[keyof typeof REGISTER_REPORT_GRANULARITY];

export function supportsRegisterReportGranularity(period: string): boolean {
  return period === "year";
}

export function defaultRegisterReportGranularity(period: string): RegisterReportGranularity {
  return period === "year"
    ? REGISTER_REPORT_GRANULARITY.MONTH
    : REGISTER_REPORT_GRANULARITY.DAY;
}

export function resolveRegisterReportGranularity(
  period: string,
  granularity: string | null | undefined,
): RegisterReportGranularity {
  if (!supportsRegisterReportGranularity(period)) {
    return REGISTER_REPORT_GRANULARITY.DAY;
  }
  return granularity === REGISTER_REPORT_GRANULARITY.DAY
    ? REGISTER_REPORT_GRANULARITY.DAY
    : REGISTER_REPORT_GRANULARITY.MONTH;
}

export function resolveRegisterReportGranularityFromSnapshot(snapshot: {
  period?: string;
  generalReportGranularity?: string;
} | null | undefined): RegisterReportGranularity {
  return resolveRegisterReportGranularity(
    snapshot?.period || "",
    snapshot?.generalReportGranularity,
  );
}

export function formatRegisterReportRowLabel(
  value: string,
  granularity: RegisterReportGranularity,
  lang: DisplayLang,
): string {
  if (granularity === REGISTER_REPORT_GRANULARITY.MONTH) {
    return formatSelectedMonth(value, lang);
  }
  return formatCalendarDate(value, lang);
}

export function registerReportGranularityCountLabel(
  count: number,
  granularity: RegisterReportGranularity,
  lang: DisplayLang,
): string {
  const safeCount = Number(count) || 0;
  if (granularity === REGISTER_REPORT_GRANULARITY.MONTH) {
    return `${safeCount} ${text(lang, "reportGranularityMonthsUnit")}`;
  }
  return `${safeCount} ${text(lang, "reportGranularityDaysUnit")}`;
}

export function registerReportGranularitySheetName(
  granularity: RegisterReportGranularity,
  lang: DisplayLang,
): string {
  if (granularity === REGISTER_REPORT_GRANULARITY.MONTH) {
    return text(lang, "reportSheetMonthly");
  }
  return text(lang, "reportSheetDaily");
}

export function registerReportGranularityColumnLabel(
  granularity: RegisterReportGranularity,
  lang: DisplayLang,
): string {
  if (granularity === REGISTER_REPORT_GRANULARITY.MONTH) {
    return text(lang, "month");
  }
  return text(lang, "day");
}
