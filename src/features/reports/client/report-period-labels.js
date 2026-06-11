import { resolveDateTimeLocale } from "@/core/i18n/display-locale";
import { monthSelectionValue } from "@/features/operations/operational-analytics";

export function formatCalendarDate(dateString, lang) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat(
    resolveDateTimeLocale(lang),
    { day: "numeric", month: "long", year: "numeric" },
  ).format(date);
}

export function formatCalendarWeekday(dateString, lang) {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(
    resolveDateTimeLocale(lang),
    { weekday: "long" },
  ).format(date);
}

export function formatRegisterCloseoutTypeLabel(dateString, lang) {
  const weekday = formatCalendarWeekday(dateString, lang);
  if (!weekday) return lang === "ar" ? "تقفيلة يوم" : "Daily closeout";
  return lang === "ar" ? `تقفيلة يوم ${weekday}` : `Daily closeout ${weekday}`;
}

function formatCalendarMonth(year, month, lang) {
  return new Intl.DateTimeFormat(
    resolveDateTimeLocale(lang),
    { month: "long", year: "numeric" },
  ).format(new Date(year, month, 1));
}

function monthSelectionParts(value) {
  const normalized = monthSelectionValue(value);
  const [year, month] = normalized.split("-").map(Number);
  return { year, month: month - 1, normalized };
}

export function formatSelectedMonth(value, lang) {
  const { year, month } = monthSelectionParts(value);
  return formatCalendarMonth(year, month, lang);
}

export function logPeriodScopeLabel(lang, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo) {
  if (period === "day") return formatCalendarDate(selectedDate, lang);
  if (period === "month") return formatSelectedMonth(selectedMonth, lang);
  if (period === "year") return selectedYear;
  return `${formatCalendarDate(customFrom, lang)} — ${formatCalendarDate(customTo, lang)}`;
}
