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

export const channelName = (channel: Record<string, unknown>, lang: "ar" | "en"): string =>
  channel.custom
    ? (lang === "ar" ? String(channel.nameAr || "") : String(channel.nameEn || ""))
    : text(lang, String(channel.text || ""));

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
export const businessName = (business: Record<string, unknown> | null | undefined, lang: "ar" | "en", short = false): string => {
  if (!business) return "";
  if (business.displayName) return String(business.displayName);
  if (short && business.shortKey) return text(lang, String(business.shortKey));
  if (business.nameKey) return text(lang, String(business.nameKey));
  return lang === "ar" ? String(business.nameAr || "") : String(business.nameEn || "");
};

export const businessLocation = (business: Record<string, unknown> | null | undefined, lang: "ar" | "en"): string =>
  business?.locationKey
    ? text(lang, String(business.locationKey))
    : String(business?.customLocation || "");

// ─── Money formatting ─────────────────────────────────────────────
export const money = (value: number | unknown, lang: "ar" | "en"): string => {
  const numericValue = Number(value) || 0;
  const sign = numericValue < 0 ? "-" : "";
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Math.abs(numericValue));
  return lang === "ar" ? `${sign}${formatted} ر.س` : `${sign}${formatted} SAR`;
};

// ─── Date formatting ──────────────────────────────────────────────
export function isoCalendarDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatCalendarDate(dateString: string, lang: "ar" | "en"): string {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat(
    lang === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US",
    { day: "numeric", month: "long", year: "numeric" },
  ).format(date);
}

export function formatCalendarMonth(year: number, month: number, lang: "ar" | "en"): string {
  return new Intl.DateTimeFormat(
    lang === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US",
    { month: "long", year: "numeric" },
  ).format(new Date(year, month, 1));
}

export function todayIsoDate(): string {
  const today = new Date();
  return isoCalendarDate(today.getFullYear(), today.getMonth(), today.getDate());
}

export function nextDayIso(dateString: string): string {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + 1);
  return isoCalendarDate(date.getFullYear(), date.getMonth(), date.getDate());
}

// ─── Entry display helpers ────────────────────────────────────────
export const opDate = (item: Record<string, unknown>, lang: "ar" | "en"): string =>
  item.date
    ? formatCalendarDate(String(item.date), lang)
    : String(lang === "ar" ? (item.dateAr || "") : (item.dateEn || ""));

export const opTime = (item: Record<string, unknown>, lang: "ar" | "en"): string =>
  item.createdAt
    ? new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(String(item.createdAt)))
    : String(lang === "ar" ? (item.timeAr || "") : (item.timeEn || ""));

export const auditDateTime = (timestamp: string, lang: "ar" | "en"): string => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "-";
  return `${formatCalendarDate(timestamp.slice(0, 10), lang)} · ${opTime({ createdAt: timestamp }, lang)}`;
};

export const employeeName = (item: Record<string, unknown>, lang: "ar" | "en"): string => {
  const by = item.enteredBy as Record<string, unknown> | undefined;
  if (by) return lang === "ar" ? String(by.nameAr || "") : String(by.nameEn || "");
  return lang === "ar" ? String(item.employeeAr || "") : String(item.employeeEn || "");
};

export const fullDate = (day: Record<string, unknown>, lang: "ar" | "en"): string => String(lang === "ar" ? (day.fullAr || "") : (day.fullEn || ""));
export const shortDate = (day: Record<string, unknown>, lang: "ar" | "en"): string => String(lang === "ar" ? (day.dayAr || "") : (day.dayEn || ""));

// ─── Entry display & label helpers ───────────────────────────────
export const signedEntryAmount = (entry: Record<string, unknown>): number =>
  entry.type === "summary" ? Number(entry.amount) : -Number(entry.amount);

export const entryWasRestored = (entry: Record<string, unknown>): boolean => Boolean(entry.restoredAt);

export const entryCategory = (entry: Record<string, unknown>): string =>
  entry.type === "purchases" ? "purchases"
    : entry.type === "withdrawal" ? "withdrawal"
      : String(entry.id || "").slice(0, 4) === "wdwl" ? "withdrawal"
        : "expense";

export function summarySalesChannelLabel(entry: Record<string, unknown>, lang: "ar" | "en"): string {
  const rows = ((entry.salesChannels || []) as {channelId?: string; name?: string; amount?: number}[]).filter((row) => row?.channelId && Number(row.amount) > 0);
  if (!rows.length) return text(lang, "summary");
  return (rows as {channelId?: string; name?: string}[]).map((row) => {
    const fallback = channels.find((channel) => channel.id === row.channelId);
    return row.name || (fallback ? channelName(fallback as Record<string,unknown>, lang) : String(row.channelId || ""));
  }).join(" · ");
}

export const noteLabel = (entry: Record<string, unknown>, lang: "ar" | "en"): string => {
  if (entry.type === "summary") return summarySalesChannelLabel(entry, lang);
  if (entry.noteKey) return text(lang, String(entry.noteKey));
  return String(entry.note || text(lang, String(entry.type || "")));
};

export const operationDisplayLabel = (entry: Record<string, unknown>, lang: "ar" | "en"): string => {
  if (entry.type === "expense")
    return text(lang, expenseCategories.find((item) => item.id === entryCategory(entry))?.label || "other");
  if (entry.type === "summary") return summarySalesChannelLabel(entry, lang);
  return text(lang, String(entry.type || ""));
};

export function newestEntries(entries: Record<string, unknown>[]): Record<string, unknown>[] {
  return [...entries].sort(
    (a, b) => `${b.date}|${b.createdAt || ""}`.localeCompare(`${a.date}|${a.createdAt || ""}`),
  );
}

export function attachmentsFromEntries(entries: Record<string, unknown>[]): Record<string, unknown>[] {
  const grouped = new Map();
  newestEntries(entries.filter((e) => Boolean(e?.attachment))).forEach((entry) => {
    if (!grouped.has(entry.date)) grouped.set(entry.date, []);
    grouped.get(entry.date).push({
      id: (entry.attachment as Record<string, unknown>).id,
      entryId: entry.id,
      title: noteLabel(entry, "ar"),
      titleEn: noteLabel(entry, "en"),
      attachment: entry.attachment,
      entry,
    });
  });
  return [...grouped.entries()].map(([date, items]) => ({ dayId: date, date, items }));
}

// Re-exports from operational-analytics for backward compatibility
export { entryHasAttachment } from "@/features/operations/operational-analytics";
