import { describe, expect, it } from "vitest";
import { calendarViewFromIsoDate } from "./date-selector-calendar-view";

describe("calendarViewFromIsoDate", () => {
  it("maps June dates to month index 5", () => {
    expect(calendarViewFromIsoDate("2026-06-15")).toEqual({ year: 2026, month: 5 });
  });

  it("maps May dates to month index 4", () => {
    expect(calendarViewFromIsoDate("2026-05-31")).toEqual({ year: 2026, month: 4 });
  });

  it("falls back to current date for invalid input", () => {
    const fallback = calendarViewFromIsoDate("");
    expect(fallback.year).toBeGreaterThan(2020);
    expect(fallback.month).toBeGreaterThanOrEqual(0);
    expect(fallback.month).toBeLessThanOrEqual(11);
  });
});
