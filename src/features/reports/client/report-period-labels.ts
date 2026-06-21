import { monthSelectionValue } from "@/features/operations/operational-analytics";
import type { DisplayLang } from "@/core/i18n/display-locale";
import type { ReportPeriod } from "@/features/reports/client/reports-client-types";

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function formatNumericDate(dateString: string | null | undefined): string {
  const match = ISO_DATE_RE.exec(String(dateString || "").trim());
  if (!match) return String(dateString || "");
  const [, year, month, day] = match;
  return `${day}-${month}-${year}`;
}

export function formatNumericMonthYear(year: number | string, monthIndex: number): string {
  return `${String(monthIndex + 1).padStart(2, "0")}-${year}`;
}

export function formatNumericMonth(value: string | null | undefined): string {
  const normalized = monthSelectionValue(value);
  const [year, month] = normalized.split("-");
  if (!year || !month) return normalized;
  return `${month}-${year}`;
}

/** Gregorian display date: dd-mm-yyyy (Saudi operational convention). */
export function formatCalendarDate(dateString: string, lang: DisplayLang): string {
  void lang;
  return formatNumericDate(dateString);
}

export function formatCalendarWeekday(dateString: string, lang: DisplayLang): string {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  const locale = lang === "ar" ? "ar-SA-u-nu-latn" : "en-US";
  return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date);
}

export function formatRegisterCloseoutTypeLabel(dateString: string, lang: DisplayLang): string {
  const dateLabel = formatNumericDate(dateString);
  if (!dateLabel) return lang === "ar" ? "تقفيلة يوم" : "Daily closeout";
  return lang === "ar" ? `تقفيلة يوم ${dateLabel}` : `Daily closeout ${dateLabel}`;
}

export function formatCalendarMonth(year: number | string, monthIndex: number, lang: DisplayLang): string {
  void lang;
  return formatNumericMonthYear(year, monthIndex);
}

export function formatSelectedMonth(value: string, lang: DisplayLang): string {
  void lang;
  return formatNumericMonth(value);
}

export function logPeriodScopeLabel(
  lang: DisplayLang,
  period: ReportPeriod,
  selectedDate: string,
  selectedMonth: string,
  selectedYear: string,
  customFrom: string,
  customTo: string,
): string {
  if (period === "day") return formatNumericDate(selectedDate);
  if (period === "month") return formatNumericMonth(selectedMonth);
  if (period === "year") return selectedYear;
  return `${formatNumericDate(customFrom)} — ${formatNumericDate(customTo)}`;
}
