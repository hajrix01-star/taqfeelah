export const ENGLISH_DISPLAY_LOCALE = "en-US";

/** Arabic copy with Western (0-9) digits — product policy for all UI numbers. */
export const ARABIC_LATIN_NUMBER_LOCALE = "ar-SA-u-nu-latn";

/** Arabic copy with Gregorian calendar and Western digits. */
export const ARABIC_LATIN_DATE_LOCALE = "ar-SA-u-ca-gregory-nu-latn";

export type DisplayLang = "ar" | "en";

export function resolveNumberLocale(lang: DisplayLang | string = "ar"): string {
  return lang === "ar" ? ARABIC_LATIN_NUMBER_LOCALE : ENGLISH_DISPLAY_LOCALE;
}

export function resolveDateTimeLocale(lang: DisplayLang | string = "ar"): string {
  return lang === "ar" ? ARABIC_LATIN_DATE_LOCALE : ENGLISH_DISPLAY_LOCALE;
}

export function formatDisplayNumber(
  value: number,
  lang: DisplayLang | string = "ar",
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(resolveNumberLocale(lang), options).format(value);
}

export function formatDisplayDateTime(
  value: Date | string | number,
  lang: DisplayLang | string = "ar",
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(resolveDateTimeLocale(lang), options).format(date);
}
