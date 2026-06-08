export const MAX_ENTRY_AMOUNT = 9999999;

const westernizeDigits = (value = "") => String(value)
  .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
  .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));

export function sanitizeAmountInput(value) {
  const cleaned = westernizeDigits(value).replace(/[٬, ]/g, "").replace(/٫/g, ".").replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  const integer = (parts[0] || "").replace(/^0+(?=[0-9])/, "");
  const decimal = parts.slice(1).join("").slice(0, 2);
  const normalized = parts.length > 1 ? `${integer || "0"}.${decimal}` : integer;
  if (Number(normalized || 0) > MAX_ENTRY_AMOUNT) return String(MAX_ENTRY_AMOUNT);
  return normalized;
}

export function toAmount(value) {
  const parsed = Number(sanitizeAmountInput(value));
  return Number.isFinite(parsed) && parsed >= 0 ? Math.min(parsed, MAX_ENTRY_AMOUNT) : 0;
}

export function draftNeedsConfirmation(...values) {
  return values.some((value) => value && (typeof value !== "object" || Object.values(value).some(Boolean)));
}
