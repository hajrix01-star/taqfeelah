import { describe, expect, it } from "vitest";
import { expandPhoneSearchDigits } from "@/core/phone/expand-phone-search-digits";
import { parseSaasAccountsSearchTerm } from "@/features/saas-admin/server/build-saas-accounts-search-filter";

describe("parseSaasAccountsSearchTerm", () => {
  it("returns null for empty search", () => {
    expect(parseSaasAccountsSearchTerm(undefined)).toBeNull();
    expect(parseSaasAccountsSearchTerm("   ")).toBeNull();
  });

  it("detects all-digit account number search", () => {
    expect(parseSaasAccountsSearchTerm("100042")).toEqual({
      trimmed: "100042",
      likePattern: "%100042%",
      loweredPattern: "%100042%",
      digitsOnly: "100042",
      isAllDigits: true,
      phoneDigitVariants: ["100042"],
    });
  });

  it("extracts digits from phone-like search", () => {
    expect(parseSaasAccountsSearchTerm("966 50 123 4567")).toEqual({
      trimmed: "966 50 123 4567",
      likePattern: "%966 50 123 4567%",
      loweredPattern: "%966 50 123 4567%",
      digitsOnly: "966501234567",
      isAllDigits: false,
      phoneDigitVariants: expect.arrayContaining(["966501234567", "501234567"]),
    });
  });

  it("normalizes email search casing", () => {
    expect(parseSaasAccountsSearchTerm("Owner@Example.COM")).toEqual({
      trimmed: "Owner@Example.COM",
      likePattern: "%Owner@Example.COM%",
      loweredPattern: "%owner@example.com%",
      digitsOnly: "",
      isAllDigits: false,
      phoneDigitVariants: [],
    });
  });

  it("expands local Saudi phone search variants", () => {
    const parsed = parseSaasAccountsSearchTerm("0501234567");
    expect(parsed?.phoneDigitVariants).toContain("501234567");
    expect(parsed?.phoneDigitVariants).toContain("966501234567");
  });

  it("expandPhoneSearchDigits matches national input without country code", () => {
    expect(expandPhoneSearchDigits("552210049")).toContain("552210049");
    expect(expandPhoneSearchDigits("552210049")).toContain("966552210049");
  });
});
