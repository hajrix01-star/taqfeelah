import { formatCalendarDate, formatSelectedMonth } from "./report-period-labels";

export const REGISTER_REPORT_GRANULARITY = {
  DAY: "day",
  MONTH: "month",
};

export function supportsRegisterReportGranularity(period) {
  return period === "year";
}

export function defaultRegisterReportGranularity(period) {
  return period === "year"
    ? REGISTER_REPORT_GRANULARITY.MONTH
    : REGISTER_REPORT_GRANULARITY.DAY;
}

export function resolveRegisterReportGranularity(period, granularity) {
  if (!supportsRegisterReportGranularity(period)) {
    return REGISTER_REPORT_GRANULARITY.DAY;
  }
  return granularity === REGISTER_REPORT_GRANULARITY.DAY
    ? REGISTER_REPORT_GRANULARITY.DAY
    : REGISTER_REPORT_GRANULARITY.MONTH;
}

export function formatRegisterReportRowLabel(value, granularity, lang) {
  if (granularity === REGISTER_REPORT_GRANULARITY.MONTH) {
    return formatSelectedMonth(value, lang);
  }
  return formatCalendarDate(value, lang);
}

export function registerReportGranularityCountLabel(count, granularity, lang) {
  const safeCount = Number(count) || 0;
  if (granularity === REGISTER_REPORT_GRANULARITY.MONTH) {
    return lang === "ar" ? `${safeCount} شهر` : `${safeCount} months`;
  }
  return lang === "ar" ? `${safeCount} يوم` : `${safeCount} days`;
}

export function registerReportGranularitySheetName(granularity, lang) {
  if (granularity === REGISTER_REPORT_GRANULARITY.MONTH) {
    return lang === "ar" ? "تقرير شهري" : "Monthly report";
  }
  return lang === "ar" ? "تقرير الأيام" : "Daily report";
}

export function registerReportGranularityColumnLabel(granularity, lang) {
  if (granularity === REGISTER_REPORT_GRANULARITY.MONTH) {
    return lang === "ar" ? "الشهر" : "Month";
  }
  return lang === "ar" ? "اليوم" : "Day";
}
