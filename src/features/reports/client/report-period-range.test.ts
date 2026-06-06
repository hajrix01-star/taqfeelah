import { describe, expect, it } from "vitest";
import { resolveReportDateRange } from "./report-period-range";

describe("resolveReportDateRange", () => {
  it("returns a single day for day period", () => {
    expect(resolveReportDateRange({
      period: "day",
      selectedDate: "2026-06-05",
    })).toEqual({ from: "2026-06-05", to: "2026-06-05" });
  });

  it("returns full month bounds for month period", () => {
    expect(resolveReportDateRange({
      period: "month",
      selectedMonth: "2026-02",
    })).toEqual({ from: "2026-02-01", to: "2026-02-28" });
  });

  it("returns year bounds for year period", () => {
    expect(resolveReportDateRange({
      period: "year",
      selectedYear: "2026",
    })).toEqual({ from: "2026-01-01", to: "2026-12-31" });
  });

  it("returns custom bounds for custom period", () => {
    expect(resolveReportDateRange({
      period: "custom",
      customFrom: "2026-03-10",
      customTo: "2026-04-02",
    })).toEqual({ from: "2026-03-10", to: "2026-04-02" });
  });
});
