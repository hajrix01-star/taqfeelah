import { closeoutSequenceLetter } from "@/features/closeouts/client/closeout-day-label";
import { shareImageThroughWhatsApp } from "@/features/daily-closeouts/notebook-image-sharing";

function formatDateParts(isoDate, lang) {
  if (!isoDate) return { dateLabel: "", weekdayLabel: "" };
  const parsed = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return { dateLabel: isoDate, weekdayLabel: "" };
  const locale = lang === "ar" ? "ar-SA-u-nu-latn" : "en-US";
  const dateLabel = new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(parsed);
  const weekdayLabel = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(parsed);
  return { dateLabel, weekdayLabel };
}

function normalizedStoreLabel(storeName, lang) {
  const normalized = String(storeName || "").trim();
  if (lang === "ar") {
    return normalized.replace(/^(?:المحل|محل)\s+/u, "").trim();
  }
  return normalized;
}

function closeoutReferenceLabel(lang, daySequence, sameDayCloseoutCount) {
  const count = Number(sameDayCloseoutCount) || 1;
  const sequence = Number(daySequence);
  if (count <= 1 || !Number.isInteger(sequence) || sequence < 1) return "";
  const letter = closeoutSequenceLetter(sequence);
  if (!letter) return "";
  return lang === "ar" ? `تقفيلة ${letter}` : `closeout ${letter}`;
}

/**
 * WhatsApp caption for sharing an operation/invoice attachment at full resolution.
 * Example (ar): فاتورة مشتريات لمحل الشامي بتاريخ 13 يونيو 2026 ويوم السبت — تقفيلة B
 * @param {{
 *   lang?: string,
 *   storeName?: string,
 *   operationLabel?: string,
 *   entryDate?: string,
 *   entryTime?: string,
 *   daySequence?: number | null,
 *   sameDayCloseoutCount?: number,
 * }} params
 */
export function buildEntryAttachmentShareCaption({
  lang = "ar",
  storeName = "",
  operationLabel = "",
  entryDate = "",
  entryTime = "",
  daySequence = null,
  sameDayCloseoutCount = 1,
}) {
  const { dateLabel, weekdayLabel } = formatDateParts(entryDate, lang);
  const storeLabel = normalizedStoreLabel(storeName, lang);
  const closeoutRef = closeoutReferenceLabel(lang, daySequence, sameDayCloseoutCount);

  if (lang === "ar") {
    const header = [
      "فاتورة",
      operationLabel || "عملية",
      storeLabel ? `لمحل ${storeLabel}` : "",
    ].filter(Boolean).join(" ");
    const datePart = [
      dateLabel ? `بتاريخ ${dateLabel}` : "",
      weekdayLabel ? `ويوم ${weekdayLabel}` : "",
    ].filter(Boolean).join(" و");
    const refPart = closeoutRef || (entryTime ? `الساعة ${entryTime}` : "");
    return [header, datePart, refPart ? `— ${refPart}` : ""].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  }

  const header = [
    "Invoice",
    operationLabel || "operation",
    storeLabel ? `for ${storeLabel}` : "",
  ].filter(Boolean).join(" ");
  const datePart = [
    dateLabel ? `on ${dateLabel}` : "",
    weekdayLabel ? `(${weekdayLabel})` : "",
  ].filter(Boolean).join(" ");
  const refPart = closeoutRef || (entryTime ? `at ${entryTime}` : "");
  return [header, datePart, refPart ? `— ${refPart}` : ""].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export async function dataUrlToShareFile(dataUrl, filename = "invoice") {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const type = blob.type || "image/jpeg";
  const extension = type.includes("png") ? "png" : "jpg";
  const safeName = String(filename).replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "invoice";
  return new File([blob], `${safeName}.${extension}`, { type });
}

export async function shareEntryAttachmentImage({ file, caption, lang }) {
  return shareImageThroughWhatsApp({
    file,
    caption,
    title: lang === "ar" ? "فاتورة" : "Invoice",
    allowFileOnlyFallback: false,
  });
}
