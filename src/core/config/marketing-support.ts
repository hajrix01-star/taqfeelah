const DEFAULT_SUPPORT_WHATSAPP = "966501234567";

export function resolveSupportWhatsAppNumber(
  env: { NEXT_PUBLIC_SUPPORT_WHATSAPP?: string } = process.env as {
    NEXT_PUBLIC_SUPPORT_WHATSAPP?: string;
  },
): string {
  const raw = env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.trim();
  if (!raw) return DEFAULT_SUPPORT_WHATSAPP;
  return raw.replace(/\D/g, "");
}

export function buildSupportWhatsAppUrl(message: string): string {
  const phone = resolveSupportWhatsAppNumber();
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
