import { describe, expect, it } from "vitest";
import {
  resolveDaysUntilPeriodEnd,
  resolveRenewalReminderTier,
  resolveSubscriptionBillingAllowed,
  resolveSubscriptionPeriodPhase,
} from "@/features/billing/server/subscription-billing-policy";

describe("subscription-billing-policy", () => {
  const now = new Date("2026-06-14T12:00:00.000Z");

  it("blocks trial immediately after period end", () => {
    const periodEnd = new Date("2026-06-13T12:00:00.000Z");
    expect(resolveSubscriptionPeriodPhase({
      subscriptionStatus: "trialing",
      periodEnd,
      isTrialPlan: true,
      now,
    })).toBe("expired");
    expect(resolveSubscriptionBillingAllowed({
      organizationStatus: "active",
      subscriptionStatus: "trialing",
      periodEnd,
      isTrialPlan: true,
      gracePeriodDays: 3,
      now,
    })).toBe(false);
  });

  it("allows paid active subscriptions during grace after period end", () => {
    const periodEnd = new Date("2026-06-12T12:00:00.000Z");
    expect(resolveSubscriptionPeriodPhase({
      subscriptionStatus: "active",
      periodEnd,
      isTrialPlan: false,
      gracePeriodDays: 3,
      now,
    })).toBe("grace");
    expect(resolveSubscriptionBillingAllowed({
      organizationStatus: "active",
      subscriptionStatus: "active",
      periodEnd,
      isTrialPlan: false,
      gracePeriodDays: 3,
      now,
    })).toBe(true);
  });

  it("blocks paid active subscriptions after grace window", () => {
    const periodEnd = new Date("2026-06-01T12:00:00.000Z");
    expect(resolveSubscriptionPeriodPhase({
      subscriptionStatus: "active",
      periodEnd,
      isTrialPlan: false,
      gracePeriodDays: 3,
      now,
    })).toBe("expired");
    expect(resolveSubscriptionBillingAllowed({
      organizationStatus: "active",
      subscriptionStatus: "active",
      periodEnd,
      isTrialPlan: false,
      gracePeriodDays: 3,
      now,
    })).toBe(false);
  });

  it("maps reminder tiers from days until end", () => {
    const periodEnd14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    expect(resolveDaysUntilPeriodEnd(periodEnd14, now)).toBe(14);
    expect(resolveRenewalReminderTier(14)).toBe(14);
    expect(resolveRenewalReminderTier(8)).toBeNull();
  });
});
