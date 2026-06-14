import { describe, expect, it } from "vitest";
import {
  formatPlanSubscriptionHomeLabel,
  formatSubscriptionStatusLabel,
  resolveSubscriptionRenewalBanner,
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

  it("surfaces renewal banner within reminder window", () => {
    const banner = resolveSubscriptionRenewalBanner({
      renewalDaysRemaining: 7,
      subscriptionPeriodPhase: "active",
      isTrialPlan: false,
      currentPeriodEnd: "2026-06-21T00:00:00.000Z",
      planDisplayNameAr: "نمو",
      planDisplayNameEn: "Growth",
      billingCycle: "yearly",
    });
    expect(banner?.key).toBe("soon7");
  });
});
