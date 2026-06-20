import { describe, expect, it } from "vitest";
import { expandPhoneSearchDigits } from "@/core/phone/expand-phone-search-digits";

describe("expandPhoneSearchDigits", () => {
  it("includes national and E.164 variants for Saudi local input", () => {
    const variants = expandPhoneSearchDigits("0501234567");
    expect(variants).toContain("501234567");
    expect(variants).toContain("966501234567");
  });

  it("includes variants for national-only input", () => {
    const variants = expandPhoneSearchDigits("501234567");
    expect(variants).toContain("501234567");
    expect(variants).toContain("966501234567");
  });

  it("includes variants for international input", () => {
    const variants = expandPhoneSearchDigits("966501234567");
    expect(variants).toContain("966501234567");
    expect(variants).toContain("501234567");
  });

  it("returns empty for short input", () => {
    expect(expandPhoneSearchDigits("05")).toEqual([]);
  });
});
