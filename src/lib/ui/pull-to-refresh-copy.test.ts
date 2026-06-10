import { describe, expect, it } from "vitest";
import { pullToRefreshStatusLabel } from "./pull-to-refresh-copy";

describe("pullToRefreshStatusLabel", () => {
  it("returns bilingual accessibility labels for pull states", () => {
    expect(pullToRefreshStatusLabel("ar", false, false)).toBe("اسحب للتحديث");
    expect(pullToRefreshStatusLabel("en", false, false)).toBe("Pull to refresh");
    expect(pullToRefreshStatusLabel("ar", false, true)).toBe("أفلت للتحديث");
    expect(pullToRefreshStatusLabel("en", false, true)).toBe("Release to refresh");
    expect(pullToRefreshStatusLabel("ar", true, false)).toBe("جاري التحديث");
    expect(pullToRefreshStatusLabel("en", true, false)).toBe("Refreshing");
  });
});
