/** Share employee closeout PNG; WhatsApp often drops `text` when `files` are attached. */
import { shareImageThroughWhatsApp } from "../daily-closeouts/notebook-image-sharing";

function formatDateParts(isoDate, lang) {
  if (!isoDate) return { dateLabel: "", weekdayLabel: "" };
  const parsed = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return { dateLabel: isoDate, weekdayLabel: "" };
  const locale = lang === "ar" ? "ar-SA" : "en-US";
  const dateLabel = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(parsed);
  const weekdayLabel = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(parsed);
  return { dateLabel, weekdayLabel };
}

function normalizedStoreLabel(storeName, lang) {
  const normalized = String(storeName || "").trim();
  if (lang === "ar") {
    if (!normalized) return "";
    return normalized.replace(/^(?:المحل|محل)\s+/u, "").trim();
  }
  return normalized;
}

export function buildEmployeeShareCaption(lang, storeName, employeeName, periodLabel, closeoutDate) {
  const { dateLabel, weekdayLabel } = formatDateParts(closeoutDate, lang);
  const fallbackDate = periodLabel || closeoutDate || "";
  const finalDate = dateLabel || fallbackDate;
  const storeLabel = normalizedStoreLabel(storeName, lang);
  if (lang === "ar") {
    const storePart = storeLabel ? ` لمحل ${storeLabel}` : "";
    const employeePart = employeeName ? ` بواسطة الموظف ${employeeName}` : "";
    const datePart = finalDate ? ` بتاريخ ${finalDate}` : "";
    const weekdayPart = weekdayLabel ? ` ويوم ${weekdayLabel}` : "";
    return `تقفيلتي${storePart}${employeePart}${datePart}${weekdayPart}`;
  }
  const storePart = storeLabel ? ` for ${storeLabel}` : "";
  const employeePart = employeeName ? ` by employee ${employeeName}` : "";
  const datePart = finalDate ? ` on ${finalDate}` : "";
  const weekdayPart = weekdayLabel ? ` (${weekdayLabel})` : "";
  return `My closeout${storePart}${employeePart}${datePart}${weekdayPart}`;
}

/**
 * @returns {{ ok: boolean, method: string }}
 */
export async function shareEmployeeCloseoutImage({ file, caption, lang }) {
  return shareImageThroughWhatsApp({
    file,
    caption,
    title: lang === "ar" ? "تقفيلتي" : "My closeout",
  });
}
