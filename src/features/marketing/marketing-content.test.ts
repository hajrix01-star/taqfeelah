import { describe, expect, it } from "vitest";
import {
  MARKETING_AUDIENCES,
  MARKETING_FEATURES,
  MARKETING_OUTCOMES,
  MARKETING_PLANS,
} from "./marketing-content";

describe("marketing content", () => {
  it("defines core product features", () => {
    expect(MARKETING_FEATURES.length).toBeGreaterThanOrEqual(4);
    expect(MARKETING_FEATURES.some((item) => item.title.includes("تقفيلة"))).toBe(true);
  });

  it("defines starter, growth, and enterprise plans", () => {
    expect(MARKETING_PLANS.map((plan) => plan.id)).toEqual(["starter", "growth", "enterprise"]);
    expect(MARKETING_PLANS[0]?.ctaLabel).toBe("ابدأ مجانًا");
  });

  it("keeps homepage copy aligned with store operations SEO intent", () => {
    const homepageCopy = [
      ...MARKETING_AUDIENCES.flatMap((item) => [item.title, item.description]),
      ...MARKETING_OUTCOMES.flatMap((item) => [item.title, item.description]),
      ...MARKETING_FEATURES.flatMap((item) => [item.title, item.description]),
    ].join(" ");

    expect(homepageCopy).toContain("المحلات");
    expect(homepageCopy).toContain("مبيعات");
    expect(homepageCopy).toContain("مصروف");
    expect(homepageCopy).toContain("تقفيل");
  });
});
