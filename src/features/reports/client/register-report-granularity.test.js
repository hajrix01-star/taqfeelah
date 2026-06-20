import { describe, expect, it } from "vitest";
import {
  defaultRegisterReportGranularity,
  formatRegisterReportRowLabel,
  registerReportGranularityCountLabel,
  registerReportGranularitySheetName,
  resolveRegisterReportGranularity,
  resolveRegisterReportGranularityFromSnapshot,
  supportsRegisterReportGranularity,
  REGISTER_REPORT_GRANULARITY,
} from "./register-report-granularity";

describe("register-report-granularity", () => {
  it("supports granularity toggle only for year period", () => {
    expect(supportsRegisterReportGranularity("year")).toBe(true);
    expect(supportsRegisterReportGranularity("month")).toBe(false);
    expect(supportsRegisterReportGranularity("day")).toBe(false);
  });

  it("defaults year to monthly and other periods to daily", () => {
    expect(defaultRegisterReportGranularity("year")).toBe(REGISTER_REPORT_GRANULARITY.MONTH);
    expect(defaultRegisterReportGranularity("month")).toBe(REGISTER_REPORT_GRANULARITY.DAY);
  });

  it("forces daily granularity outside year period", () => {
    expect(resolveRegisterReportGranularity("month", REGISTER_REPORT_GRANULARITY.MONTH))
      .toBe(REGISTER_REPORT_GRANULARITY.DAY);
    expect(resolveRegisterReportGranularity("year", REGISTER_REPORT_GRANULARITY.MONTH))
      .toBe(REGISTER_REPORT_GRANULARITY.MONTH);
  });

  it("resolves granularity from snapshot root only", () => {
    expect(resolveRegisterReportGranularityFromSnapshot({
      period: "year",
      generalReportGranularity: "day",
    })).toBe(REGISTER_REPORT_GRANULARITY.DAY);
    expect(resolveRegisterReportGranularityFromSnapshot({
      period: "month",
      generalReportGranularity: "month",
    })).toBe(REGISTER_REPORT_GRANULARITY.DAY);
  });

  it("formats row labels and export labels by granularity", () => {
    expect(formatRegisterReportRowLabel("2026-06-15", REGISTER_REPORT_GRANULARITY.DAY, "ar"))
      .toBe("15-06-2026");
    expect(formatRegisterReportRowLabel("2026-06", REGISTER_REPORT_GRANULARITY.MONTH, "ar"))
      .toBe("06-2026");
    expect(registerReportGranularityCountLabel(12, REGISTER_REPORT_GRANULARITY.MONTH, "ar"))
      .toBe("12 شهر");
    expect(registerReportGranularitySheetName(REGISTER_REPORT_GRANULARITY.MONTH, "en"))
      .toBe("Monthly report");
  });
});
