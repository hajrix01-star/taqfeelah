import { describe, expect, it } from "vitest";
import { isCloseoutSubmitDateAllowed } from "./closeout-submit-date";

describe("isCloseoutSubmitDateAllowed", () => {
  it("accepts today and past dates in Saudi business date", () => {
    const now = new Date("2026-06-20T15:00:00.000Z");
    expect(isCloseoutSubmitDateAllowed("2026-06-20", now)).toBe(true);
    expect(isCloseoutSubmitDateAllowed("2026-06-01", now)).toBe(true);
  });

  it("allows the Saudi business date when Riyadh is one calendar day ahead of UTC", () => {
    const now = new Date("2026-06-20T22:00:00.000Z");
    expect(isCloseoutSubmitDateAllowed("2026-06-21", now)).toBe(true);
  });

  it("rejects dates after the Saudi business date", () => {
    const now = new Date("2026-06-20T20:00:00.000Z");
    expect(isCloseoutSubmitDateAllowed("2026-06-21", now)).toBe(false);
  });

  it("rejects far-future dates", () => {
    const now = new Date("2026-06-20T22:00:00.000Z");
    expect(isCloseoutSubmitDateAllowed("2099-12-31", now)).toBe(false);
  });
});
