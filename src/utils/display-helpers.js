/**
 * Shared display utilities — formatting, labelling, and demo store config.
 * Used by owner screens (OwnerSettingsScreen, ReportsScreen, OwnerRegisterScreen)
 * and the main runtime file.
 *
 * NOTE: `text()` is the authoritative copy lookup. All functions here
 * that depend on i18n accept `lang` as a parameter.
 */

import { text } from "@/i18n/text";

// ─── Channel defaults ────────────────────────────────────────────
export const channels = [
  { id: "cash", text: "cash" },
  { id: "mada", text: "mada" },
  { id: "apple", text: "apple" },
  { id: "jahez", text: "jahez" },
  { id: "hunger", text: "hunger" },
];

export const channelName = (channel, lang) =>
  channel.custom
    ? (lang === "ar" ? channel.nameAr : channel.nameEn)
    : text(lang, channel.text);

// ─── Expense categories ──────────────────────────────────────────
export const expenseCategories = [
  { id: "rent", label: "rent", amount: 8000 },
  { id: "salary", label: "salary", amount: 12000 },
  { id: "utility", label: "utility", amount: 2400 },
  { id: "phone", label: "phone", amount: 650 },
  { id: "maintenance", label: "maintenance", amount: 1200 },
  { id: "other", label: "other", amount: 270 },
];

export const outflowReportCategories = [
  { id: "all", label: "allCategories" },
  { id: "purchases", label: "purchases" },
  { id: "withdrawal", label: "withdrawal" },
  ...expenseCategories,
];

// ─── Demo store defaults ─────────────────────────────────────────
export const emptyStoreRecord = { sales: 0, expense: 0, ratio: "0.0%", net: 0, proofs: 0, pending: 0 };

export const businesses = [
  {
    id: "shami",
    nameKey: "restaurant",
    shortKey: "shamiShort",
    locationKey: "shamiLocation",
    day: { ...emptyStoreRecord },
    month: { ...emptyStoreRecord },
  },
  {
    id: "arz",
    nameAr: "لاونج ARZ",
    nameEn: "ARZ Lounge",
    shortKey: "arzShort",
    locationKey: "arzLocation",
    day: { ...emptyStoreRecord },
    month: { ...emptyStoreRecord },
  },
];

// ─── Business display helpers ─────────────────────────────────────
export const businessName = (business, lang, short = false) => {
  if (!business) return "";
  if (business.displayName) return business.displayName;
  if (short && business.shortKey) return text(lang, business.shortKey);
  if (business.nameKey) return text(lang, business.nameKey);
  return lang === "ar" ? business.nameAr : business.nameEn;
};

export const businessLocation = (business, lang) =>
  business?.locationKey
    ? text(lang, business.locationKey)
    : (business?.customLocation || "");

// ─── Money formatting ─────────────────────────────────────────────
export const money = (value, lang) => {
  const numericValue = Number(value) || 0;
  const sign = numericValue < 0 ? "-" : "";
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Math.abs(numericValue));
  return lang === "ar" ? `${sign}${formatted} ر.س` : `${sign}${formatted} SAR`;
};

// ─── Date formatting ──────────────────────────────────────────────
export function isoCalendarDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatCalendarDate(dateString, lang) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat(
    lang === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US",
    { day: "numeric", month: "long", year: "numeric" },
  ).format(date);
}

export function formatCalendarMonth(year, month, lang) {
  return new Intl.DateTimeFormat(
    lang === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US",
    { month: "long", year: "numeric" },
  ).format(new Date(year, month, 1));
}

export function todayIsoDate() {
  const today = new Date();
  return isoCalendarDate(today.getFullYear(), today.getMonth(), today.getDate());
}

export function nextDayIso(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + 1);
  return isoCalendarDate(date.getFullYear(), date.getMonth(), date.getDate());
}

// ─── Entry display helpers ────────────────────────────────────────
export const opDate = (item, lang) =>
  item.date
    ? formatCalendarDate(item.date, lang)
    : (lang === "ar" ? item.dateAr : item.dateEn);

export const opTime = (item, lang) =>
  item.createdAt
    ? new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(item.createdAt))
    : (lang === "ar" ? item.timeAr : item.timeEn);

export const auditDateTime = (timestamp, lang) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "-";
  return `${formatCalendarDate(timestamp.slice(0, 10), lang)} · ${opTime({ createdAt: timestamp }, lang)}`;
};

export const employeeName = (item, lang) =>
  item.enteredBy
    ? (lang === "ar" ? item.enteredBy.nameAr : item.enteredBy.nameEn)
    : (lang === "ar" ? item.employeeAr : item.employeeEn);

export const fullDate = (day, lang) => (lang === "ar" ? day.fullAr : day.fullEn);
export const shortDate = (day, lang) => (lang === "ar" ? day.dayAr : day.dayEn);
