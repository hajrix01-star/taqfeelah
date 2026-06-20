import { describe, expect, it } from "vitest";
import { isCloseoutSubmitDateAllowed } from "./closeout-submit-date";

describe("isCloseoutSubmitDateAllowed", () => {
  it("accepts today and past dates in UTC", () => {
    const now = new Date("2026-06-20T15:00:00.000Z");
    expect(isCloseoutSubmitDateAllowed("2026-06-20", now)).toBe(true);
    expect(isCloseoutSubmitDateAllowed("2026-06-01", now)).toBe(true);
  });

  it("allows one calendar day ahead of UTC for east-of-UTC clients", () => {
    const now = new Date("2026-06-20T22:00:00.000Z");
    expect(isCloseoutSubmitDateAllowed("2026-06-21", now)).toBe(true);
  });

  it("rejects far-future dates", () => {
    const now = new Date("2026-06-20T22:00:00.000Z");
    expect(isCloseoutSubmitDateAllowed("2099-12-31", now)).toBe(false);
  });
});
