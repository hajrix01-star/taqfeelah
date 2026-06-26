import type { AppLang } from "./taqfeelah-app-types";
import { SUPPORT_WHATSAPP } from "./taqfeelah-app-boot";

export function openWhatsAppSupport(lang: AppLang) {
  window.open(
    `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(lang === "ar" ? "مرحبًا، أحتاج دعم تقفيلة" : "Hello, I need Taqfeelah support")}`,
    "_blank",
  );
}
