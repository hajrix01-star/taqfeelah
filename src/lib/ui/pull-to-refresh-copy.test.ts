import { describe, expect, it } from "vitest";
import { pullToRefreshLabel } from "./pull-to-refresh-copy";

describe("pullToRefreshLabel", () => {
  it("returns bilingual pull, release, and refreshing labels", () => {
    expect(pullToRefreshLabel("ar", "pull")).toBe("اسحب للتحديث");
    expect(pullToRefreshLabel("en", "pull")).toBe("Pull to refresh");
    expect(pullToRefreshLabel("ar", "release")).toBe("أفلت للتحديث");
    expect(pullToRefreshLabel("en", "release")).toBe("Release to refresh");
    expect(pullToRefreshLabel("ar", "refreshing")).toBe("جاري التحديث...");
    expect(pullToRefreshLabel("en", "refreshing")).toBe("Refreshing...");
  });
});
