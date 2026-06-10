import { describe, expect, it } from "vitest";
import {
  EMPLOYEE_CLOSEOUTS_ALL_CAP_DAYS,
  EMPLOYEE_HISTORY_VISIBILITY,
  employeeHistoryCutoffDate,
  firstDayOfCalendarMonthIso,
  isCloseoutWithinEmployeeHistory,
  resolveEmployeeCloseoutsFetchWindow,
} from "./employee-closeout-history";

describe("resolveEmployeeCloseoutsFetchWindow", () => {
  const today = "2026-06-10";

  it("uses rolling week window", () => {
    expect(resolveEmployeeCloseoutsFetchWindow(EMPLOYEE_HISTORY_VISIBILITY.week, today)).toEqual({
      dateFrom: "2026-06-04",
      dateTo: today,
    });
  });

  it("uses calendar month window", () => {
    expect(resolveEmployeeCloseoutsFetchWindow(EMPLOYEE_HISTORY_VISIBILITY.month, today)).toEqual({
      dateFrom: "2026-06-01",
      dateTo: today,
    });
    expect(firstDayOfCalendarMonthIso(today)).toBe("2026-06-01");
  });

  it("caps all visibility at 90 days for API loads", () => {
    const window = resolveEmployeeCloseoutsFetchWindow(EMPLOYEE_HISTORY_VISIBILITY.all, today);
    expect(window.dateTo).toBe(today);
    expect(window.dateFrom).toBe("2026-03-13");
    expect(EMPLOYEE_CLOSEOUTS_ALL_CAP_DAYS).toBe(90);
  });

  it("defaults missing visibility to calendar month", () => {
    expect(resolveEmployeeCloseoutsFetchWindow("", today).dateFrom).toBe("2026-06-01");
  });
});

describe("employeeHistoryCutoffDate alignment", () => {
  it("filters closeouts using the same cutoff as fetch window", () => {
    const visibility = EMPLOYEE_HISTORY_VISIBILITY.month;
    const cutoff = employeeHistoryCutoffDate(visibility, "2026-06-10");
    expect(isCloseoutWithinEmployeeHistory({ date: "2026-05-31" }, visibility, "2026-06-10")).toBe(false);
    expect(isCloseoutWithinEmployeeHistory({ date: cutoff }, visibility, "2026-06-10")).toBe(true);
  });
});
