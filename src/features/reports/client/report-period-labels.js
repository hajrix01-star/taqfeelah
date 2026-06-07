import { monthSelectionValue } from "@/features/operations/operational-analytics";

export function formatCalendarDate(dateString, lang) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat(
    lang === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US",
    { day: "numeric", month: "long", year: "numeric" },
  ).format(date);
}

function formatCalendarMonth(year, month, lang) {
  return new Intl.DateTimeFormat(
    lang === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US",
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
