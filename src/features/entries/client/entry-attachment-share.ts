import { closeoutSequenceLetter } from "@/features/closeouts/client/closeout-day-label";
import { shareImageThroughWhatsApp } from "@/features/daily-closeouts/notebook-image-sharing";
import { formatNumericDate } from "@/features/reports/client/report-period-labels";
import type { DisplayLang } from "@/core/i18n/display-locale";
import type { EntryAttachmentShareCaptionParams } from "./entries-client-types";

function normalizedStoreLabel(storeName: string, lang: string): string {
  const normalized = String(storeName || "").trim();
  if (lang === "ar") {
    return normalized.replace(/^(?:المحل|محل)\s+/u, "").trim();
  }
  return normalized;
}

function closeoutReferenceLabel(
  lang: string,
  daySequence: number | null | undefined,
  sameDayCloseoutCount: number,
): string {
  const count = Number(sameDayCloseoutCount) || 1;
  const sequence = Number(daySequence);
  if (count <= 1 || !Number.isInteger(sequence) || sequence < 1) return "";
  const letter = closeoutSequenceLetter(sequence);
  if (!letter) return "";
  return lang === "ar" ? `تقفيلة ${letter}` : `closeout ${letter}`;
}

export function buildEntryAttachmentShareCaption({
  lang = "ar",
  storeName = "",
  operationLabel = "",
  entryDate = "",
  entryTime = "",
  daySequence = null,
  sameDayCloseoutCount = 1,
}: EntryAttachmentShareCaptionParams = {}): string {
  const dateLabel = formatNumericDate(entryDate);
  const storeLabel = normalizedStoreLabel(storeName, lang);
  const closeoutRef = closeoutReferenceLabel(lang, daySequence, sameDayCloseoutCount);

  if (lang === "ar") {
    const header = [
      "فاتورة",
      operationLabel || "عملية",
      storeLabel ? `لمحل ${storeLabel}` : "",
    ].filter(Boolean).join(" ");
    const datePart = dateLabel ? `بتاريخ ${dateLabel}` : "";
    const refPart = closeoutRef || (entryTime ? `الساعة ${entryTime}` : "");
    return [header, datePart, refPart ? `— ${refPart}` : ""].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  }

  const header = [
    "Invoice",
    operationLabel || "operation",
    storeLabel ? `for ${storeLabel}` : "",
  ].filter(Boolean).join(" ");
  const datePart = dateLabel ? `on ${dateLabel}` : "";
  const refPart = closeoutRef || (entryTime ? `at ${entryTime}` : "");
  return [header, datePart, refPart ? `— ${refPart}` : ""].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export async function dataUrlToShareFile(dataUrl: string, filename = "invoice"): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const type = blob.type || "image/jpeg";
  const extension = type.includes("png") ? "png" : "jpg";
  const safeName = String(filename).replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "invoice";
  return new File([blob], `${safeName}.${extension}`, { type });
}

export async function shareEntryAttachmentImage({
  file,
  caption,
  lang,
}: {
  file: File;
  caption: string;
  lang: DisplayLang | string;
}): Promise<unknown> {
  type ShareParams = {
    file?: File | null;
    caption?: string;
    title?: string;
    allowFileOnlyFallback?: boolean;
  };
  const shareWhatsApp = shareImageThroughWhatsApp as (params: ShareParams) => ReturnType<typeof shareImageThroughWhatsApp>;
  return shareWhatsApp({
    file,
    caption,
    title: lang === "ar" ? "فاتورة" : "Invoice",
    allowFileOnlyFallback: false,
  });
}
