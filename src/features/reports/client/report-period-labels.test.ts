import { describe, expect, it } from "vitest";
import {
  formatCalendarDate,
  formatCalendarMonth,
  formatCalendarWeekday,
  formatNumericDate,
  formatNumericMonth,
  formatRegisterCloseoutTypeLabel,
  formatSelectedMonth,
  logPeriodScopeLabel,
} from "./report-period-labels";

describe("report-period-labels", () => {
  it("formats calendar dates as dd-mm-yyyy in every language", () => {
    expect(formatNumericDate("2026-06-06")).toBe("06-06-2026");
    expect(formatCalendarDate("2026-06-06", "ar")).toBe("06-06-2026");
    expect(formatCalendarDate("2026-06-06", "en")).toBe("06-06-2026");
  });

  it("formats month labels as mm-yyyy", () => {
    expect(formatNumericMonth("2026-05")).toBe("05-2026");
    expect(formatSelectedMonth("2026-05", "en")).toBe("05-2026");
    expect(formatCalendarMonth(2026, 5, "ar")).toBe("06-2026");
  });

  it("still formats weekday names when requested explicitly", () => {
    expect(formatCalendarWeekday("2026-06-07", "ar")).toMatch(/الأحد|الاحد/i);
    expect(formatCalendarWeekday("2026-06-07", "en")).toMatch(/Sunday/i);
  });

  it("formats register closeout labels with numeric dates", () => {
    expect(formatRegisterCloseoutTypeLabel("2026-06-07", "ar")).toBe("تقفيلة يوم 07-06-2026");
    expect(formatRegisterCloseoutTypeLabel("2026-06-07", "en")).toBe("Daily closeout 07-06-2026");
  });

  it("builds log period scope labels", () => {
    expect(logPeriodScopeLabel("en", "day", "2026-06-06", "2026-05", "2026", "2026-01-01", "2026-06-30")).toBe("06-06-2026");
    expect(logPeriodScopeLabel("en", "month", "2026-06-06", "2026-05", "2026", "2026-01-01", "2026-06-30")).toBe("05-2026");
    expect(logPeriodScopeLabel("en", "year", "2026-06-06", "2026-05", "2026", "2026-01-01", "2026-06-30")).toBe("2026");
    expect(logPeriodScopeLabel("en", "custom", "2026-06-06", "2026-05", "2026", "2026-01-01", "2026-06-30")).toBe("01-01-2026 — 30-06-2026");
  });
});
