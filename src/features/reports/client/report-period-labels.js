import { monthSelectionValue } from "@/features/operations/operational-analytics";

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function formatNumericDate(dateString) {
  const match = ISO_DATE_RE.exec(String(dateString || "").trim());
  if (!match) return String(dateString || "");
  const [, year, month, day] = match;
  return `${day}-${month}-${year}`;
}

export function formatNumericMonthYear(year, monthIndex) {
  return `${String(monthIndex + 1).padStart(2, "0")}-${year}`;
}

export function formatNumericMonth(value) {
  const normalized = monthSelectionValue(value);
  const [year, month] = normalized.split("-");
  if (!year || !month) return normalized;
  return `${month}-${year}`;
}

/** Gregorian display date: dd-mm-yyyy (Saudi operational convention). */
export function formatCalendarDate(dateString, _lang) {
  return formatNumericDate(dateString);
}

export function formatCalendarWeekday(dateString, lang) {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  const locale = lang === "ar" ? "ar-SA-u-nu-latn" : "en-US";
  return new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date);
}

export function formatRegisterCloseoutTypeLabel(dateString, lang) {
  const dateLabel = formatNumericDate(dateString);
  if (!dateLabel) return lang === "ar" ? "تقفيلة يوم" : "Daily closeout";
  return lang === "ar" ? `تقفيلة يوم ${dateLabel}` : `Daily closeout ${dateLabel}`;
}

export function formatCalendarMonth(year, monthIndex, _lang) {
  return formatNumericMonthYear(year, monthIndex);
}

export function formatSelectedMonth(value, _lang) {
  return formatNumericMonth(value);
}

export function logPeriodScopeLabel(lang, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo) {
  if (period === "day") return formatNumericDate(selectedDate);
  if (period === "month") return formatNumericMonth(selectedMonth);
  if (period === "year") return selectedYear;
  return `${formatNumericDate(customFrom)} — ${formatNumericDate(customTo)}`;
}
