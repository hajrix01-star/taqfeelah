import { text } from "@/components/prototype-runtime/prototype-runtime-demo-data";
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

export function resolveRegisterReportGranularityFromSnapshot(snapshot) {
  return resolveRegisterReportGranularity(
    snapshot?.period,
    snapshot?.generalReportGranularity,
  );
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
    return `${safeCount} ${text(lang, "reportGranularityMonthsUnit")}`;
  }
  return `${safeCount} ${text(lang, "reportGranularityDaysUnit")}`;
}

export function registerReportGranularitySheetName(granularity, lang) {
  if (granularity === REGISTER_REPORT_GRANULARITY.MONTH) {
    return text(lang, "reportSheetMonthly");
  }
  return text(lang, "reportSheetDaily");
}

export function registerReportGranularityColumnLabel(granularity, lang) {
  if (granularity === REGISTER_REPORT_GRANULARITY.MONTH) {
    return text(lang, "month");
  }
  return text(lang, "day");
}
