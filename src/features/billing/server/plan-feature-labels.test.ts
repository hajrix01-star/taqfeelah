import { describe, expect, it } from "vitest";
import { buildPlanFeatureLabels } from "@/features/billing/server/plan-feature-labels";

describe("buildPlanFeatureLabels", () => {
  it("includes store and employee limits plus catalog feature flags", () => {
    const labels = buildPlanFeatureLabels({
      maxStores: 3,
      maxEmployees: 20,
      trialDays: 15,
      features: { isTrialPlan: true, multiStore: true },
    });

    expect(labels.map((item) => item.key)).toEqual([
      "isTrialPlan",
      "maxStores",
      "maxEmployees",
      "multiStore",
      "trialDuration",
    ]);
    expect(labels[1]?.labelAr).toContain("3");
    expect(labels[3]?.labelEn).toBe("Multi-store management");
  });
});
