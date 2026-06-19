import { normalizeLoginPhone } from "@/core/phone/normalize-login-phone";
import { readPublicEnvString } from "@/core/config/public-env";

/** Production support line (0533507223). Used when env is unset — not a placeholder demo number. */
export const PRODUCTION_SUPPORT_WHATSAPP = "966533507223";

/** @deprecated Legacy demo fallback — do not use in new code; kept for grep-based deploy guards. */
export const LEGACY_DEMO_SUPPORT_WHATSAPP = "966501234567";

export function resolveSupportWhatsAppNumber(
  env?: { NEXT_PUBLIC_SUPPORT_WHATSAPP?: string },
): string {
  const raw = readPublicEnvString("NEXT_PUBLIC_SUPPORT_WHATSAPP", env).trim();
  if (!raw) return PRODUCTION_SUPPORT_WHATSAPP;
  return normalizeLoginPhone(raw).replace(/^\+/, "");
}

export function buildSupportWhatsAppUrl(message: string): string {
  const phone = resolveSupportWhatsAppNumber();
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
