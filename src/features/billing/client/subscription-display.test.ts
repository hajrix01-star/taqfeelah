import { describe, expect, it } from "vitest";
import {
  formatPlanSubscriptionHomeLabel,
  formatSubscriptionStatusLabel,
} from "@/features/billing/client/subscription-display";

describe("subscription-display", () => {
  it("labels paid starter in trialing as trial period, not free trial", () => {
    expect(formatSubscriptionStatusLabel("trialing", "ar", { isTrialPlan: false })).toBe("فترة تجريبية");
    expect(formatSubscriptionStatusLabel("trialing", "ar", { isTrialPlan: true })).toBe("تجريبي");
  });

  it("shows plan name with trial period on settings home", () => {
    const label = formatPlanSubscriptionHomeLabel({
      planDisplayNameAr: "أساسية",
      planDisplayNameEn: "Starter",
      isTrialPlan: false,
      subscriptionStatus: "trialing",
    }, "ar");
    expect(label).toBe("أساسية — فترة تجريبية");
  });
});
