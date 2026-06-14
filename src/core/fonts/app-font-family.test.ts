import { describe, expect, it } from "vitest";
import { resolveAppFontFamily } from "./app-font-family";

describe("app-font-family", () => {
  it("resolves locale-specific css variable font stacks", () => {
    expect(resolveAppFontFamily("ar")).toContain("--font-noto-sans-arabic");
    expect(resolveAppFontFamily("en")).toContain("--font-noto-sans");
    expect(resolveAppFontFamily("ar")).not.toBe(resolveAppFontFamily("en"));
  });
});
