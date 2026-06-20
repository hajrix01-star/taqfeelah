import { normalizeWhatsAppPhone } from "@/core/phone/normalize-whatsapp-phone";

export function buildWhatsAppShareUrl(message: string, phone?: string | null): string {
  const encoded = encodeURIComponent(message);
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (normalizedPhone) {
    return `https://wa.me/${normalizedPhone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

export function openWhatsAppShare(message: string, phone?: string | null): void {
  if (typeof window === "undefined") return;
  const url = buildWhatsAppShareUrl(message, phone);
  window.open(url, "_blank", "noopener,noreferrer");
}
