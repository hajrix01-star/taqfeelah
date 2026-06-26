import { normalizeLoginPhone } from "@/core/phone/normalize-login-phone";
import { readPublicEnvString } from "@/core/config/public-env";

/** Production support line (0533507223). Used when env is unset. */
export const PRODUCTION_SUPPORT_WHATSAPP = "966533507223";

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
