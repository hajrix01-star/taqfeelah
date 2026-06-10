import { describe, expect, it } from "vitest";
import { resolveOwnerCloseoutsFetchWindow } from "./owner-closeouts-fetch-window";

describe("resolveOwnerCloseoutsFetchWindow", () => {
  it("caps owner closeouts to a rolling 90-day window", () => {
    const window = resolveOwnerCloseoutsFetchWindow("2026-06-10");
    expect(window.dateTo).toBe("2026-06-10");
    expect(window.dateFrom).toBe("2026-03-12");
  });
});
