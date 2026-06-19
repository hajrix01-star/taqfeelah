import { describe, expect, it } from "vitest";
import { formatOrganizationAccountNumber } from "./format-organization-account-number";

describe("formatOrganizationAccountNumber", () => {
  it("returns numeric string", () => {
    expect(formatOrganizationAccountNumber(100042)).toBe("100042");
  });

  it("returns empty for invalid values", () => {
    expect(formatOrganizationAccountNumber(0)).toBe("");
    expect(formatOrganizationAccountNumber(null)).toBe("");
  });
});
