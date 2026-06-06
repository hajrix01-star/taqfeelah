const EXPENSE_CATEGORY_KEYS = new Set([
  "rent",
  "salary",
  "utility",
  "phone",
  "maintenance",
  "other",
  "electricity",
]);

export function resolveOutflowCategoryKey(input: {
  type: string;
  categoryId?: string | null;
  categoryName?: string | null;
}): string {
  if (input.type === "purchases") return "purchases";
  if (input.type === "withdrawal") return "withdrawal";
  if (typeof input.categoryId === "string" && EXPENSE_CATEGORY_KEYS.has(input.categoryId)) {
    return input.categoryId;
  }
  const normalizedName = (input.categoryName || "").trim().toLowerCase();
  if (normalizedName) {
    for (const key of EXPENSE_CATEGORY_KEYS) {
      if (normalizedName.includes(key)) return key;
    }
    if (normalizedName.includes("كهرباء") || normalizedName.includes("electric")) return "utility";
    if (normalizedName.includes("هاتف")) return "phone";
    if (normalizedName.includes("إيجار") || normalizedName.includes("rent")) return "rent";
    if (normalizedName.includes("راتب") || normalizedName.includes("salary")) return "salary";
    if (normalizedName.includes("صيانة") || normalizedName.includes("maintenance")) return "maintenance";
  }
  return "other";
}
