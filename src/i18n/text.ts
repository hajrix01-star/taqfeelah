import copy from "@/i18n/copy";

export type Lang = "ar" | "en";

/** Lookup a bilingual string from the copy dictionary. Falls back to the key. */
export function text(lang: Lang, key: string): string {
  return copy[lang]?.[key] ?? key;
}
