import { describe, expect, it } from "vitest";
import { resolveAccountStatus } from "@/features/saas-admin/server/saas-admin-utils";

describe("resolveAccountStatus", () => {
  it("returns archived when organization is archived", () => {
    expect(resolveAccountStatus({
      organizationStatus: "archived",
      subscriptionStatus: "active",
    })).toBe("archived");
  });

  it("returns suspended when organization is suspended", () => {
    expect(resolveAccountStatus({
      organizationStatus: "suspended",
      subscriptionStatus: "active",
    })).toBe("suspended");
  });

  it("returns trial when subscription is trialing and org is active", () => {
    expect(resolveAccountStatus({
      organizationStatus: "active",
      subscriptionStatus: "trialing",
    })).toBe("trial");
  });
});
