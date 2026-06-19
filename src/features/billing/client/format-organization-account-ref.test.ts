import { describe, expect, it } from "vitest";
import { formatOrganizationAccountRef } from "./format-organization-account-ref";

describe("formatOrganizationAccountRef", () => {
  it("returns first 8 hex chars uppercase without dashes", () => {
    expect(formatOrganizationAccountRef("a712f7e5-638a-4711-9f89-5efb02da8a71")).toBe("A712F7E5");
  });

  it("returns empty for missing input", () => {
    expect(formatOrganizationAccountRef("")).toBe("");
    expect(formatOrganizationAccountRef(null)).toBe("");
  });
});
