import { describe, expect, it } from "vitest";
import { MARKETING_EQUATION, MARKETING_TAGLINE } from "./marketing-brand";
import { MARKETING_FEATURES, MARKETING_PLANS } from "./marketing-content";

describe("marketing content", () => {
  it("defines core product features with brand keywords", () => {
    expect(MARKETING_FEATURES.length).toBeGreaterThanOrEqual(4);
    expect(MARKETING_FEATURES.some((item) => item.keyword === "داخل")).toBe(true);
    expect(MARKETING_FEATURES.some((item) => item.keyword === "خارج")).toBe(true);
    expect(MARKETING_FEATURES.some((item) => item.keyword === "الباقي")).toBe(true);
  });

  it("defines starter, growth, and enterprise plans", () => {
    expect(MARKETING_PLANS.map((plan) => plan.id)).toEqual(["starter", "growth", "enterprise"]);
    expect(MARKETING_PLANS[0]?.ctaLabel).toBe("ابدأ مجانًا");
  });

  it("uses approved brand tagline and equation", () => {
    expect(MARKETING_TAGLINE).toBe("حسبة بدو. لا تعقدها.");
    expect(MARKETING_EQUATION).toBe("داخل − خارج = الباقي");
  });
});
