import { describe, expect, it } from "vitest";
import { formatDateTime, formatNumber } from "./format-utils";

describe("saas-admin format-utils", () => {
  it("formats Arabic dashboard numbers with Latin digits", () => {
    const formatted = formatNumber(12840, "ar");
    expect(formatted).toContain("12");
    expect(formatted).not.toMatch(/[٠-٩]/);
  });

  it("formats Arabic dashboard datetimes with Latin digits", () => {
    const formatted = formatDateTime("2026-06-11T15:30:00.000Z", "ar");
    expect(formatted).toMatch(/2026/);
    expect(formatted).not.toMatch(/[٠-٩]/);
  });

  it("formats English numbers unchanged", () => {
    expect(formatNumber(42, "en")).toBe("42");
  });
});
