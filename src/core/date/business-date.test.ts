import { describe, expect, it } from "vitest";
import { businessDateInTimeZone, todayBusinessDateIso } from "./business-date";

describe("Saudi business date", () => {
  it("uses Asia/Riyadh instead of the user's local browser date", () => {
    const lateUtc = new Date("2026-06-20T22:00:00.000Z");
    expect(businessDateInTimeZone(lateUtc)).toBe("2026-06-21");
    expect(todayBusinessDateIso(lateUtc)).toBe("2026-06-21");
  });
});
