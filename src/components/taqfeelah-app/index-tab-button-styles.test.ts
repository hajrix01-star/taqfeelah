import { describe, expect, it } from "vitest";
import { buildIndexTabBorderClass } from "./index-tab-button-styles";

describe("buildIndexTabBorderClass", () => {
  it("returns empty string for inactive tabs", () => {
    expect(buildIndexTabBorderClass(0, 3, false)).toBe("");
  });

  it("rounds logical top corners on main-tier edge tabs", () => {
    expect(buildIndexTabBorderClass(0, 3, true)).toContain("rounded-ts-[14px]");
    expect(buildIndexTabBorderClass(2, 3, true)).toContain("rounded-te-[14px]");
    expect(buildIndexTabBorderClass(1, 3, true)).not.toContain("rounded-ts");
    expect(buildIndexTabBorderClass(1, 3, true)).not.toContain("rounded-te");
  });

  it("uses border instead of ring for active tabs", () => {
    const cls = buildIndexTabBorderClass(0, 2, true);
    expect(cls).toContain("border-2");
    expect(cls).toContain("border-b-0");
    expect(cls).not.toContain("ring");
  });

  it("skips corner rounding for sub-tier tabs", () => {
    const cls = buildIndexTabBorderClass(0, 3, true, { tier: "sub" });
    expect(cls).not.toContain("rounded-ts");
    expect(cls).not.toContain("rounded-te");
  });
});
