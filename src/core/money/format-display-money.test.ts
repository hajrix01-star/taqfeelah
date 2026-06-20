import { describe, expect, it } from "vitest";
import {
  formatDisplayMoneyFromHalalas,
  formatDisplayMoneyFromRiyals,
  formatDisplayMoneyLabel,
  halalasHaveFraction,
  resolveExcelMoneyNumFmt,
  resolveExcelMoneyNumFmtForValues,
  resolveMoneyNumberFormatOptions,
  riyalsHaveHalalas,
} from "./format-display-money";

describe("format-display-money", () => {
  it("detects whole riyals without halalas", () => {
    expect(riyalsHaveHalalas(108705)).toBe(false);
    expect(halalasHaveFraction(10870500)).toBe(false);
    expect(resolveMoneyNumberFormatOptions(150)).toEqual({
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  });

  it("shows up to two decimals only when halalas exist", () => {
    expect(formatDisplayMoneyFromRiyals(150, "ar")).toBe("150");
    expect(formatDisplayMoneyFromRiyals(150.75, "ar")).toBe("150.75");
    expect(formatDisplayMoneyFromRiyals(150.5, "ar")).toBe("150.50");
    expect(formatDisplayMoneyFromHalalas(15050, "ar")).toBe("150.50");
    expect(formatDisplayMoneyFromHalalas(15075, "ar")).toBe("150.75");
  });

  it("never renders more than two decimal places", () => {
    expect(formatDisplayMoneyFromRiyals(1.999, "en")).toBe("2");
    expect(formatDisplayMoneyFromRiyals(1.234, "en")).toBe("1.23");
  });

  it("uses Latin digits in Arabic labels", () => {
    const formatted = formatDisplayMoneyLabel(108705, "ar");
    expect(formatted).toBe("108,705 ر.س");
    expect(formatted).not.toMatch(/[٠-٩]/);
  });

  it("resolves excel number format from fractional presence", () => {
    expect(resolveExcelMoneyNumFmt(150)).toBe("#,##0");
    expect(resolveExcelMoneyNumFmt(150.75)).toBe("#,##0.00");
    expect(resolveExcelMoneyNumFmtForValues([150, 200])).toBe("#,##0");
    expect(resolveExcelMoneyNumFmtForValues([150, 150.25])).toBe("#,##0.00");
  });
});
