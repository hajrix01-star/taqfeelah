import { normalizeLoginPhone } from "@/core/phone/normalize-login-phone";

export const DEFAULT_DIAL_CODE = "+966";

export type SplitLoginPhone = {
  dialCode: string;
  nationalNumber: string;
};

export function splitLoginPhone(raw: string | null | undefined): SplitLoginPhone {
  const normalized = typeof raw === "string" ? raw.trim() : "";
  if (!normalized) {
    return { dialCode: DEFAULT_DIAL_CODE, nationalNumber: "" };
  }

  if (normalized.startsWith("+966")) {
    return {
      dialCode: "+966",
      nationalNumber: normalized.slice(4),
    };
  }

  if (normalized.startsWith("+")) {
    const match = normalized.match(/^(\+\d{1,4})(\d+)$/);
    if (match) {
      return {
        dialCode: match[1],
        nationalNumber: match[2],
      };
    }
  }

  return {
    dialCode: DEFAULT_DIAL_CODE,
    nationalNumber: normalized.replace(/\D/g, ""),
  };
}

export function composeLoginPhone(dialCode: string, nationalNumber: string): string {
  const code = dialCode.trim() || DEFAULT_DIAL_CODE;
  let digits = nationalNumber.replace(/\D/g, "");
  if (!digits) return "";
  if (code === DEFAULT_DIAL_CODE && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return normalizeLoginPhone(`${code}${digits}`);
}

export function formatLoginPhoneForDisplay(raw: string | null | undefined): string {
  const { dialCode, nationalNumber } = splitLoginPhone(raw);
  if (!nationalNumber) return "";
  return `${dialCode} ${nationalNumber}`;
}
