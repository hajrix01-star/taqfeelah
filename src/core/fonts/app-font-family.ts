export type AppUiLang = "ar" | "en";

const FONT_STACK: Record<AppUiLang, string> = {
  ar: "var(--font-noto-sans-arabic), var(--font-noto-sans), sans-serif",
  en: "var(--font-noto-sans), var(--font-noto-sans-arabic), sans-serif",
};

export function resolveAppFontFamily(lang: AppUiLang): string {
  return FONT_STACK[lang];
}
