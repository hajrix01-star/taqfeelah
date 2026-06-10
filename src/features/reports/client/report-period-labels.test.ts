import { describe, expect, it } from "vitest";
import {
  formatCalendarDate,
  formatCalendarWeekday,
  formatRegisterCloseoutTypeLabel,
  formatSelectedMonth,
  logPeriodScopeLabel,
} from "./report-period-labels";

describe("report-period-labels", () => {
  it("formats calendar dates in Arabic and English", () => {
    expect(formatCalendarDate("2026-06-06", "ar")).toContain("2026");
    expect(formatCalendarDate("2026-06-06", "en")).toContain("2026");
  });

  it("formats weekday names for closeout register labels", () => {
    expect(formatCalendarWeekday("2026-06-07", "ar")).toMatch(/الأحد|الاحد/i);
    expect(formatCalendarWeekday("2026-06-07", "en")).toMatch(/Sunday/i);
    expect(formatRegisterCloseoutTypeLabel("2026-06-07", "ar")).toMatch(/تقفيلة يوم/);
    expect(formatRegisterCloseoutTypeLabel("2026-06-07", "en")).toBe("Daily closeout Sunday");
  });

  it("formats selected month labels", () => {
    expect(formatSelectedMonth("2026-05", "en")).toContain("2026");
  });

  it("builds log period scope labels", () => {
    expect(logPeriodScopeLabel("en", "day", "2026-06-06", "2026-05", "2026", "2026-01-01", "2026-06-30")).toContain("2026");
    expect(logPeriodScopeLabel("en", "year", "2026-06-06", "2026-05", "2026", "2026-01-01", "2026-06-30")).toBe("2026");
  });
});
