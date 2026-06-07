import { PROTOTYPE_SUPPORT_WHATSAPP } from "./prototype-runtime-boot";

export function openWhatsAppSupport(lang) {
  window.open(
    `https://wa.me/${PROTOTYPE_SUPPORT_WHATSAPP}?text=${encodeURIComponent(lang === "ar" ? "مرحبًا، أحتاج دعم تقفيلة" : "Hello, I need Taqfeelah support")}`,
    "_blank",
  );
}
