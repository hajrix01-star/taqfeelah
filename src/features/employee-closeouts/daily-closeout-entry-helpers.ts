import { toAmount } from "../../components/prototype-runtime/prototype-runtime-entry-form-utils";
import { formatDisplayMoneyFromRiyals } from "@/core/money/format-display-money";
import type { CloseoutSyncLang } from "@/features/daily-closeouts/daily-closeouts-types";
import type { CloseoutAttachmentPreview, CloseoutOutflowRow } from "./employee-closeouts-types";

export const EXPENSE_CATEGORIES = [
  { id: "electricity", ar: "كهرباء", en: "Electricity" },
  { id: "phone", ar: "هاتف", en: "Phone" },
  { id: "rent", ar: "إيجار", en: "Rent" },
  { id: "maintenance", ar: "صيانة", en: "Maintenance" },
  { id: "salary", ar: "راتب", en: "Salary" },
  { id: "other", ar: "أخرى", en: "Other" },
] as const;

export const OUTFLOW_TYPES = [
  { id: "purchases", ar: "مشتريات", en: "Purchases" },
  { id: "expense", ar: "مصروف", en: "Expense" },
  { id: "withdrawal", ar: "سحب", en: "Withdrawal" },
] as const;

export const moneyInputClass = "w-full bg-transparent text-center text-sm font-black outline-none [direction:ltr]";

export function formatCloseoutMoney(value: number | string | null | undefined, lang: CloseoutSyncLang): string {
  return formatDisplayMoneyFromRiyals(Number(value || 0), lang);
}

export function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function attachmentDataUrlsFromList(rawList: CloseoutAttachmentPreview[] | null | undefined): string[] {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map((item) => resolveAttachmentPreviewSrc(item))
    .filter(Boolean);
}

export function resolveAttachmentPreviewSrc(item: CloseoutAttachmentPreview): string {
  if (typeof item === "string" && item.startsWith("data:")) return item;
  if (item && typeof item === "object" && typeof item.dataUrl === "string" && item.dataUrl.startsWith("data:")) {
    return item.dataUrl;
  }
  return "";
}

export function buildCloseoutOutflowRow({
  lang,
  outType,
  expenseCategory,
  outNote,
  amountValue,
  attachments = [],
}: {
  lang: CloseoutSyncLang;
  outType: string;
  expenseCategory?: string | null;
  outNote?: string;
  amountValue?: string | number;
  attachments?: CloseoutAttachmentPreview[];
}): CloseoutOutflowRow | null {
  const amount = toAmount(amountValue ?? "");
  if (!amount) return null;
  let category: string | null = null;
  const localeKey = lang === "ar" ? "ar" : "en";
  let typeLabel = OUTFLOW_TYPES.find((item) => item.id === outType)?.[localeKey] || outType;
  if (outType === "expense") {
    const cat = EXPENSE_CATEGORIES.find((item) => item.id === expenseCategory);
    category = lang === "ar" ? cat?.ar || null : cat?.en || null;
    typeLabel = lang === "ar" ? "مصروف" : "Expense";
  }
  return {
    id: `out-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: outType,
    typeLabel,
    category: category ?? undefined,
    categoryId: outType === "expense" ? expenseCategory || null : null,
    note: String(outNote || "").trim(),
    amount,
    attachments: attachmentDataUrlsFromList(attachments),
  };
}

export function buildCloseoutEntryTitles(lang: CloseoutSyncLang) {
  return {
    date: lang === "ar" ? "اختر التاريخ" : "Pick date",
    sales: lang === "ar" ? "الداخل" : "Sales",
    outflows: lang === "ar" ? "الخارج" : "Outflows",
    photos: lang === "ar" ? "صور إثبات الداخل (اختياري)" : "Inflow proof photos (optional)",
    outflowProofHint: lang === "ar"
      ? "ارفع صورة الفاتورة مع بند الخارج — نوع الإثبات يُحدد تلقائيًا من نوع العملية (مشتريات / مصروف / سحب)."
      : "Attach the invoice with this outflow — proof type follows the operation (purchases / expense / withdrawal).",
    inflowProofHint: lang === "ar"
      ? "صور عامة لإثبات الداخل أو التقفيلة — ليست مربوطة ببند خارج محدد."
      : "General inflow or closeout proofs — not tied to a specific outflow line.",
    review: lang === "ar" ? "المراجعة" : "Review",
  };
}
