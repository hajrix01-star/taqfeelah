import {
  formatDisplayNumber,
  type DisplayLang,
} from "@/core/i18n/display-locale";

/** Product policy: money never shows more than two decimal places (halalas). */
export const MONEY_MAX_FRACTION_DIGITS = 2;

export function riyalsHaveHalalas(riyals: number): boolean {
  if (!Number.isFinite(riyals)) return false;
  return Math.abs(Math.round(riyals * 100)) % 100 !== 0;
}

export function halalasHaveFraction(halalas: number): boolean {
  if (!Number.isFinite(halalas)) return false;
  return Math.abs(Math.round(halalas)) % 100 !== 0;
}

export function resolveMoneyNumberFormatOptions(
  riyals: number,
): Pick<Intl.NumberFormatOptions, "minimumFractionDigits" | "maximumFractionDigits"> {
  const hasHalalas = riyalsHaveHalalas(riyals);
  return {
    minimumFractionDigits: hasHalalas ? MONEY_MAX_FRACTION_DIGITS : 0,
    maximumFractionDigits: MONEY_MAX_FRACTION_DIGITS,
  };
}

export function formatDisplayMoneyFromRiyals(
  riyals: number,
  lang: DisplayLang | string = "ar",
): string {
  const numericValue = Number(riyals) || 0;
  return formatDisplayNumber(numericValue, lang, resolveMoneyNumberFormatOptions(numericValue));
}

export function formatDisplayMoneyFromHalalas(
  halalas: number,
  lang: DisplayLang | string = "ar",
): string {
  if (!Number.isFinite(halalas)) {
    return formatDisplayMoneyFromRiyals(0, lang);
  }
  const hasHalalas = halalasHaveFraction(halalas);
  return formatDisplayNumber(halalas / 100, lang, {
    minimumFractionDigits: hasHalalas ? MONEY_MAX_FRACTION_DIGITS : 0,
    maximumFractionDigits: MONEY_MAX_FRACTION_DIGITS,
  });
}

export function formatDisplayMoneyLabel(
  riyals: number,
  lang: DisplayLang | string = "ar",
): string {
  const numericValue = Number(riyals) || 0;
  const sign = numericValue < 0 ? "-" : "";
  const formatted = formatDisplayMoneyFromRiyals(Math.abs(numericValue), lang);
  return lang === "ar" ? `${sign}${formatted} ر.س` : `${sign}${formatted} SAR`;
}

export function resolveExcelMoneyNumFmt(riyals: number): string {
  return riyalsHaveHalalas(riyals) ? "#,##0.00" : "#,##0";
}

export function resolveExcelMoneyNumFmtForValues(values: number[]): string {
  return values.some((value) => riyalsHaveHalalas(Number(value) || 0)) ? "#,##0.00" : "#,##0";
}
