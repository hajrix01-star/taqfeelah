import { describe, expect, it } from "vitest";
import {
  ARABIC_LATIN_DATE_LOCALE,
  ARABIC_LATIN_NUMBER_LOCALE,
  formatDisplayNumber,
  resolveDateTimeLocale,
  resolveNumberLocale,
} from "./display-locale";

describe("display-locale", () => {
  it("uses Latin digits for Arabic number locale", () => {
    expect(resolveNumberLocale("ar")).toBe(ARABIC_LATIN_NUMBER_LOCALE);
    const formatted = formatDisplayNumber(12345, "ar");
    expect(formatted).toMatch(/1/);
    expect(formatted).not.toMatch(/[٠-٩]/);
  });

  it("uses Latin digits in Arabic datetime locale", () => {
    expect(resolveDateTimeLocale("ar")).toBe(ARABIC_LATIN_DATE_LOCALE);
    const formatted = new Intl.DateTimeFormat(resolveDateTimeLocale("ar"), {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date("2026-06-11T12:00:00"));
    expect(formatted).toMatch(/2026/);
    expect(formatted).not.toMatch(/[٠-٩]/);
  });

  it("keeps en-US for English", () => {
    expect(resolveNumberLocale("en")).toBe("en-US");
    expect(formatDisplayNumber(42, "en")).toBe("42");
  });
});
