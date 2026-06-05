/** Share employee closeout PNG; WhatsApp often drops `text` when `files` are attached. */
import { copyShareCaptionText, shareImageThroughWhatsApp } from "../daily-closeouts/notebook-image-sharing";

function formatDateParts(isoDate, lang) {
  if (!isoDate) return { dateLabel: "", weekdayLabel: "" };
  const parsed = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return { dateLabel: isoDate, weekdayLabel: "" };
  const locale = lang === "ar" ? "ar-SA" : "en-US";
  const dateLabel = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(parsed);
  const weekdayLabel = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(parsed);
  return { dateLabel, weekdayLabel };
}

export function buildEmployeeShareCaption(lang, storeName, employeeName, periodLabel, closeoutDate) {
  const { dateLabel, weekdayLabel } = formatDateParts(closeoutDate, lang);
  const fallbackDate = periodLabel || closeoutDate || "";
  const finalDate = dateLabel || fallbackDate;
  if (lang === "ar") {
    const employeePart = employeeName ? ` بواسطة الموظف ${employeeName}` : "";
    const weekdayPart = weekdayLabel ? ` ويوم ${weekdayLabel}` : "";
    return `تقفيلة محل ${storeName}${employeePart} بتاريخ ${finalDate}${weekdayPart}`;
  }
  const employeePart = employeeName ? ` by employee ${employeeName}` : "";
  const weekdayPart = weekdayLabel ? ` (${weekdayLabel})` : "";
  return `Closeout for ${storeName}${employeePart} on ${finalDate}${weekdayPart}`;
}

export async function copyEmployeeShareCaption(caption) {
  return copyShareCaptionText(caption);
}

/**
 * @returns {{ ok: boolean, method: string }}
 */
export async function shareEmployeeCloseoutImage({ file, caption, lang }) {
  return shareImageThroughWhatsApp({
    file,
    caption,
    lang,
    title: lang === "ar" ? "تقفيلتي" : "My closeout",
    pasteHint: lang === "ar"
      ? "تم نسخ الصورة — الصقها في محادثة واتساب."
      : "Image copied — paste it in WhatsApp chat.",
  });
}
