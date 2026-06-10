import { describe, expect, it } from "vitest";
import { pullToRefreshLabel, pullToRefreshStatusLabel } from "./pull-to-refresh-copy";

describe("pullToRefreshLabel", () => {
  it("returns visible chip labels for pull phases", () => {
    expect(pullToRefreshLabel("ar", "pull")).toBe("اسحب للتحديث");
    expect(pullToRefreshLabel("en", "pull")).toBe("Pull to refresh");
    expect(pullToRefreshLabel("ar", "release")).toBe("أفلت للتحديث");
    expect(pullToRefreshLabel("en", "release")).toBe("Release to refresh");
    expect(pullToRefreshLabel("ar", "refreshing")).toBe("جاري التحديث...");
    expect(pullToRefreshLabel("en", "refreshing")).toBe("Refreshing...");
  });
});

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
