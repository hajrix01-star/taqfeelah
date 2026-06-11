import { describe, expect, it } from "vitest";
import { formatReleaseBrand, formatReleaseLine } from "@/release/format-release";

describe("formatReleaseBrand", () => {
  it("formats Arabic and English brand labels", () => {
    expect(formatReleaseBrand("V1", "ar")).toBe("تقفيلة V1");
    expect(formatReleaseBrand("V1", "en")).toBe("Taqfeelah V1");
  });
});

describe("formatReleaseLine", () => {
  it("includes build suffix when requested", () => {
    expect(
      formatReleaseLine({ label: "V1", build: "abcdef123456" }, "ar", { showBuild: true }),
    ).toBe("تقفيلة V1 · abcdef12");
  });

  it("hides build suffix for dev builds", () => {
    expect(
      formatReleaseLine({ label: "V1", build: "dev" }, "ar", { showBuild: true }),
    ).toBe("تقفيلة V1");
  });
});
