import { describe, expect, it } from "vitest";
import {
  percentOfTotal,
  resolveEngagementSegment,
  resolveSubscriberBillingType,
} from "./engagement-segments";

describe("engagement segments", () => {
  it("classifies billing types for trial and paid", () => {
    expect(resolveSubscriberBillingType("trialing")).toBe("trial");
    expect(resolveSubscriberBillingType("active")).toBe("paid");
    expect(resolveSubscriberBillingType("past_due")).toBe("paid");
    expect(resolveSubscriberBillingType(null)).toBe("free");
  });

  it("classifies power, regular, intermittent, and dormant usage", () => {
    expect(resolveEngagementSegment({
      activeDaysL30: 16,
      organizationStatus: "active",
      subscriptionStatus: "active",
      daysSinceLastCoreActivity: 1,
    })).toBe("power");

    expect(resolveEngagementSegment({
      activeDaysL30: 10,
      organizationStatus: "active",
      subscriptionStatus: "trialing",
      daysSinceLastCoreActivity: 2,
    })).toBe("regular");

    expect(resolveEngagementSegment({
      activeDaysL30: 3,
      organizationStatus: "active",
      subscriptionStatus: "active",
      daysSinceLastCoreActivity: 4,
    })).toBe("intermittent");

    expect(resolveEngagementSegment({
      activeDaysL30: 0,
      organizationStatus: "active",
      subscriptionStatus: "active",
      daysSinceLastCoreActivity: 12,
    })).toBe("dormant");
  });

  it("computes subscriber mix percentages", () => {
    expect(percentOfTotal(25, 100)).toBe(25);
    expect(percentOfTotal(1, 3)).toBe(33.3);
  });
});
