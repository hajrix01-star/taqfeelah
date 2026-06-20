import { normalizeLoginPhone } from "@/core/phone/normalize-login-phone";
import { DEFAULT_DIAL_CODE, sanitizeNationalPhoneInput } from "@/core/phone/split-login-phone";

function pushDigitVariant(variants: Set<string>, raw: string): void {
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 3) {
    variants.add(digits);
  }
}

/** Expand a phone search query into digit variants (national, E.164, 05…, 966…). */
export function expandPhoneSearchDigits(raw: string | null | undefined): string[] {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) return [];

  const variants = new Set<string>();
  pushDigitVariant(variants, trimmed);

  const national = sanitizeNationalPhoneInput(trimmed, DEFAULT_DIAL_CODE);
  if (national.length >= 8) {
    pushDigitVariant(variants, national);

    const normalized = normalizeLoginPhone(trimmed);
    if (normalized) {
      pushDigitVariant(variants, normalized);
      pushDigitVariant(variants, normalized.replace(/^\+966/, ""));
      pushDigitVariant(variants, normalized.replace(/^\+/, ""));
    }
  }

  const rawDigits = trimmed.replace(/\D/g, "");
  if (rawDigits.startsWith("0")) {
    pushDigitVariant(variants, rawDigits.slice(1));
  }
  if (rawDigits.startsWith("966")) {
    pushDigitVariant(variants, rawDigits.slice(3));
  }

  return [...variants];
}
