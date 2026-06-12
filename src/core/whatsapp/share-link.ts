function normalizeWhatsAppPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0") && digits.length === 10) return `966${digits.slice(1)}`;
  return digits;
}

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
