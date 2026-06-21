/** Share employee closeout PNG with image + caption together via the native share sheet. */
import { shareImageThroughWhatsApp } from "../daily-closeouts/notebook-image-sharing";
import { formatNumericDate } from "@/features/reports/client/report-period-labels";
import { formatDisplayMoneyLabel } from "@/core/money/format-display-money";
import type { CloseoutShareTotalsInput, CloseoutSyncLang } from "@/features/daily-closeouts/daily-closeouts-types";
import type { EmployeeShareTotals } from "./employee-closeouts-types";

function formatShareMoney(value: number, lang: CloseoutSyncLang): string {
  return formatDisplayMoneyLabel(value, lang);
}

function normalizedStoreLabel(storeName: string, lang: CloseoutSyncLang): string {
  const normalized = String(storeName || "").trim();
  if (lang === "ar") {
    if (!normalized) return "";
    return normalized.replace(/^(?:المحل|محل)\s+/u, "").trim();
  }
  return normalized;
}

export function buildEmployeeShareCaption(
  lang: CloseoutSyncLang,
  storeName: string,
  employeeName: string,
  periodLabel: string,
  closeoutDate: string,
  totals: EmployeeShareTotals = null,
): string {
  const numericDate = formatNumericDate(closeoutDate);
  const finalDate = numericDate || periodLabel || closeoutDate || "";
  const storeLabel = normalizedStoreLabel(storeName, lang);
  const shareTotals = totals as CloseoutShareTotalsInput | null | undefined;
  const sales = Number(shareTotals?.sales || 0);
  const expense = Number(shareTotals?.expense || 0);
  const net = Number.isFinite(Number(shareTotals?.net)) ? Number(shareTotals?.net) : sales - expense;
  const amountsLine = lang === "ar"
    ? `الداخل: ${formatShareMoney(sales, lang)} | الخارج: ${formatShareMoney(expense, lang)} | الناتج: ${formatShareMoney(net, lang)}`
    : `In: ${formatShareMoney(sales, lang)} | Out: ${formatShareMoney(expense, lang)} | Net: ${formatShareMoney(net, lang)}`;
  if (lang === "ar") {
    const storePart = storeLabel ? ` لمحل ${storeLabel}` : "";
    const employeePart = employeeName ? ` بواسطة الموظف ${employeeName}` : "";
    const datePart = finalDate ? ` بتاريخ ${finalDate}` : "";
    const header = `تقفيلتي${storePart}${employeePart}${datePart}`;
    return `${header}\n${amountsLine}`;
  }
  const storePart = storeLabel ? ` for ${storeLabel}` : "";
  const employeePart = employeeName ? ` by employee ${employeeName}` : "";
  const datePart = finalDate ? ` on ${finalDate}` : "";
  const header = `My closeout${storePart}${employeePart}${datePart}`;
  return `${header}\n${amountsLine}`;
}

export async function shareEmployeeCloseoutImage({
  file,
  caption,
  lang,
}: {
  file: File;
  caption: string;
  lang: CloseoutSyncLang;
}): Promise<{ ok: boolean; method: string }> {
  return shareImageThroughWhatsApp({
    file,
    caption,
    title: lang === "ar" ? "تقفيلتي" : "My closeout",
    allowFileOnlyFallback: false,
  });
}
