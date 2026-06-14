import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetEnvCacheForTests } from "@/core/config/env";
import {
  ownerRequest,
  readJsonBody,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_ORGANIZATION_ID,
} from "./helpers";

const resolveOrganizationEntitlements = vi.fn();

vi.mock("@/features/billing/server/resolve-organization-entitlements", () => ({
  resolveOrganizationEntitlements,
}));

describe("billing entitlements route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    __resetEnvCacheForTests();
    resolveOrganizationEntitlements.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("GET /billing/entitlements returns subscription overview for owner", async () => {
    resolveOrganizationEntitlements.mockResolvedValueOnce({
      organizationId: TEST_ORGANIZATION_ID,
      planCode: "starter",
      planDisplayNameAr: "أساسية",
      planDisplayNameEn: "Starter",
      subscriptionStatus: "trialing",
      organizationStatus: "active",
      billingAllowed: true,
      maxStores: 1,
      maxEmployees: 5,
      priceMonthlyHalalas: 9900,
      priceYearlyHalalas: 99000,
      trialDays: 15,
      isTrialPlan: true,
      trialDaysRemaining: 10,
      renewalDaysRemaining: 10,
      subscriptionPeriodPhase: "active",
      renewalReminderTier: null,
      gracePeriodDays: 3,
      billingCycle: "monthly",
      currentPeriodEnd: null,
      features: [{ key: "isTrialPlan", labelAr: "خطة تجريبية مجانية", labelEn: "Free trial plan" }],
      upgradePlans: [],
      usage: { activeStores: 1, activeEmployees: 2, pendingInvitations: 0 },
      overrides: {
        maxStores: null,
        maxEmployees: null,
        priceMonthlyHalalas: null,
        notes: null,
      },
    });

    const { GET } = await import("../billing/entitlements/route");
    const response = await GET(ownerRequest("http://localhost/api/v1/billing/entitlements"));

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ planCode: string; planDisplayNameEn: string }>(response);
    expect(body.planCode).toBe("starter");
    expect(body.planDisplayNameEn).toBe("Starter");
    expect(resolveOrganizationEntitlements).toHaveBeenCalledWith(TEST_ORGANIZATION_ID);
  });
});
