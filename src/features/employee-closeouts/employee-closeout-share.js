/** Share employee closeout PNG; WhatsApp often drops `text` when `files` are attached. */
import { shareImageThroughWhatsApp } from "../daily-closeouts/notebook-image-sharing";

function formatShareMoney(value, lang) {
  const numericValue = Number(value) || 0;
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Math.abs(numericValue));
  return lang === "ar" ? `${formatted} ر.س` : `${formatted} SAR`;
}

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

/**
 * @param {{ sales?: number, expense?: number, net?: number } | null | undefined} totals
 */
export function buildEmployeeShareCaption(lang, storeName, employeeName, periodLabel, closeoutDate, totals = null) {
  const { dateLabel, weekdayLabel } = formatDateParts(closeoutDate, lang);
  const fallbackDate = periodLabel || closeoutDate || "";
  const finalDate = dateLabel || fallbackDate;
  const storeLabel = normalizedStoreLabel(storeName, lang);
  const sales = Number(totals?.sales || 0);
  const expense = Number(totals?.expense || 0);
  const net = Number.isFinite(Number(totals?.net)) ? Number(totals.net) : sales - expense;
  const amountsLine = sales > 0 || expense > 0
    ? (lang === "ar"
      ? `الداخل: ${formatShareMoney(sales, lang)} | الخارج: ${formatShareMoney(expense, lang)} | الناتج: ${formatShareMoney(net, lang)}`
      : `In: ${formatShareMoney(sales, lang)} | Out: ${formatShareMoney(expense, lang)} | Net: ${formatShareMoney(net, lang)}`)
    : "";
  if (lang === "ar") {
    const storePart = storeLabel ? ` لمحل ${storeLabel}` : "";
    const employeePart = employeeName ? ` بواسطة الموظف ${employeeName}` : "";
    const datePart = finalDate ? ` بتاريخ ${finalDate}` : "";
    const weekdayPart = weekdayLabel ? ` ويوم ${weekdayLabel}` : "";
    const header = `تقفيلتي${storePart}${employeePart}${datePart}${weekdayPart}`;
    return amountsLine ? `${header}\n${amountsLine}` : header;
  }
  const storePart = storeLabel ? ` for ${storeLabel}` : "";
  const employeePart = employeeName ? ` by employee ${employeeName}` : "";
  const datePart = finalDate ? ` on ${finalDate}` : "";
  const weekdayPart = weekdayLabel ? ` (${weekdayLabel})` : "";
  const header = `My closeout${storePart}${employeePart}${datePart}${weekdayPart}`;
  return amountsLine ? `${header}\n${amountsLine}` : header;
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
