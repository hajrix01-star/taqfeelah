import { describe, expect, it } from "vitest";
import { closeoutDateSchema } from "./closeout-date-validation";

describe("closeoutDateSchema", () => {
  it("accepts today and past dates", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(closeoutDateSchema.safeParse(today).success).toBe(true);
    expect(closeoutDateSchema.safeParse("2020-01-01").success).toBe(true);
  });

  it("rejects far-future dates", () => {
    const parsed = closeoutDateSchema.safeParse("2099-12-31");
    expect(parsed.success).toBe(false);
  });

  it("rejects tomorrow after the Saudi business date", () => {
    const today = new Date().toISOString().slice(0, 10);
    const [y, m, d] = today.split("-").map(Number);
    const tomorrow = new Date(Date.UTC(y, m - 1, d + 2)).toISOString().slice(0, 10);
    expect(closeoutDateSchema.safeParse(tomorrow).success).toBe(false);
  });

  it("rejects invalid formats", () => {
    expect(closeoutDateSchema.safeParse("2026/06/05").success).toBe(false);
  });
});
