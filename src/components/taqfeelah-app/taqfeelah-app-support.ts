import type { PrototypeLang } from "./taqfeelah-app-types";
import { PROTOTYPE_SUPPORT_WHATSAPP } from "./taqfeelah-app-boot";

export function openWhatsAppSupport(lang: PrototypeLang) {
  window.open(
    `https://wa.me/${PROTOTYPE_SUPPORT_WHATSAPP}?text=${encodeURIComponent(lang === "ar" ? "مرحبًا، أحتاج دعم تقفيلة" : "Hello, I need Taqfeelah support")}`,
    "_blank",
  );
}
