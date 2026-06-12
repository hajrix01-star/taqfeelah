import { describe, expect, it } from "vitest";
import { buildPlanFeatureLabels } from "@/features/billing/server/plan-feature-labels";

describe("buildPlanFeatureLabels", () => {
  it("includes store and employee limits plus catalog feature flags", () => {
    const labels = buildPlanFeatureLabels({
      maxStores: 3,
      maxEmployees: 20,
      trialDays: 14,
      features: { multiStore: true },
    });

    expect(labels.map((item) => item.key)).toEqual([
      "maxStores",
      "maxEmployees",
      "multiStore",
      "trial",
    ]);
    expect(labels[0]?.labelAr).toContain("3");
    expect(labels[2]?.labelEn).toBe("Multi-store management");
  });
});
