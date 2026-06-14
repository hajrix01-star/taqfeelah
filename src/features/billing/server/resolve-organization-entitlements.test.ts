import { describe, expect, it } from "vitest";
import { buildPlanFeatureLabels } from "@/features/billing/server/plan-feature-labels";

describe("resolveOrganizationEntitlements feature labels", () => {
  it("uses effective limits when overrides reduce employee seats", () => {
    const plan = {
      maxStores: 3,
      maxEmployees: 3,
      trialDays: 15,
      features: { isTrialPlan: true },
    };
    const maxStores = 1;
    const maxEmployees = 1;

    const labels = buildPlanFeatureLabels({
      ...plan,
      maxStores,
      maxEmployees,
    });

    expect(labels.find((item) => item.key === "maxStores")?.labelAr).toBe("محل واحد");
    expect(labels.find((item) => item.key === "maxEmployees")?.labelAr).toBe("موظف واحد");
  });
});
