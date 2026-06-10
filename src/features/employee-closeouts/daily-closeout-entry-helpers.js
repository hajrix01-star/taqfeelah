import { toAmount } from "../../components/prototype-runtime/prototype-runtime-entry-form-utils";

export const EXPENSE_CATEGORIES = [
  { id: "electricity", ar: "كهرباء", en: "Electricity" },
  { id: "phone", ar: "هاتف", en: "Phone" },
  { id: "rent", ar: "إيجار", en: "Rent" },
  { id: "maintenance", ar: "صيانة", en: "Maintenance" },
  { id: "salary", ar: "راتب", en: "Salary" },
  { id: "other", ar: "أخرى", en: "Other" },
];

export const OUTFLOW_TYPES = [
  { id: "purchases", ar: "مشتريات", en: "Purchases" },
  { id: "expense", ar: "مصروف", en: "Expense" },
  { id: "withdrawal", ar: "سحب", en: "Withdrawal" },
];

export const moneyInputClass = "w-full bg-transparent text-center text-sm font-black outline-none [direction:ltr]";

export function formatCloseoutMoney(value, lang) {
  return Number(value || 0).toLocaleString(lang === "ar" ? "en-US" : "en-US");
}

export function todayIsoDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function buildCloseoutOutflowRow({
  lang,
  outType,
  expenseCategory,
  outNote,
  amountValue,
}) {
  const amount = toAmount(amountValue);
  if (!amount) return null;
  let category = null;
  let typeLabel = OUTFLOW_TYPES.find((item) => item.id === outType)?.[lang === "ar" ? "ar" : "en"] || outType;
  if (outType === "expense") {
    const cat = EXPENSE_CATEGORIES.find((item) => item.id === expenseCategory);
    category = lang === "ar" ? cat?.ar : cat?.en;
    typeLabel = lang === "ar" ? "مصروف" : "Expense";
  }
  return {
    id: `out-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: outType,
    typeLabel,
    category,
    categoryId: outType === "expense" ? expenseCategory : null,
    note: String(outNote || "").trim(),
    amount,
    attachments: [],
  };
}

export function buildCloseoutEntryTitles(lang) {
  return {
    date: lang === "ar" ? "اختر التاريخ" : "Pick date",
    sales: lang === "ar" ? "الداخل" : "Sales",
    outflows: lang === "ar" ? "الخارج" : "Outflows",
    photos: lang === "ar" ? "صور الإثبات" : "Proof photos",
    review: lang === "ar" ? "المراجعة" : "Review",
  };
}
