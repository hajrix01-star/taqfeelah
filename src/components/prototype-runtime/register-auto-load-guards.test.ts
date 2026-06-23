import { describe, expect, it } from "vitest";
import { buildRegisterAutoLoadContextKey } from "./register-auto-load-guards";

describe("register auto load guards", () => {
  it("builds a stable context key for register auto-load", () => {
    const key = buildRegisterAutoLoadContextKey({
      safeBusinessId: "all",
      period: "month",
      selectedDate: "2026-06-23",
      selectedMonth: "2026-06",
      selectedYear: "2026",
      customFrom: "2026-01-01",
      customTo: "2026-06-23",
    });

    expect(key).toBe("all|month|2026-06-23|2026-06|2026|2026-01-01|2026-06-23");
    expect(key).toBe(buildRegisterAutoLoadContextKey({
      safeBusinessId: "all",
      period: "month",
      selectedDate: "2026-06-23",
      selectedMonth: "2026-06",
      selectedYear: "2026",
      customFrom: "2026-01-01",
      customTo: "2026-06-23",
    }));
  });
});