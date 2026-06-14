import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetEnvCacheForTests } from "@/core/config/env";
import {
  ownerRequest,
  readJsonBody,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_OWNER_USER_ID,
} from "./helpers";

const updateSaasAccountSubscription = vi.fn();

vi.mock("@/features/saas-admin/server/update-saas-account-subscription", () => ({
  updateSaasAccountSubscription,
}));

describe("saas admin subscription route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    process.env.SAAS_ADMIN_API_ENABLED = "true";
    process.env.SAAS_PLATFORM_ADMIN_USER_IDS = TEST_OWNER_USER_ID;
    __resetEnvCacheForTests();
    updateSaasAccountSubscription.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
    delete process.env.SAAS_ADMIN_API_ENABLED;
    delete process.env.SAAS_PLATFORM_ADMIN_USER_IDS;
  });

  it("PATCH /saas-admin/accounts/:id/subscription upgrades subscription", async () => {
    updateSaasAccountSubscription.mockResolvedValueOnce({
      organizationId: "org-1",
      subscriptionId: "sub-1",
      planCode: "growth",
      status: "active",
      billingCycle: "monthly",
      currentPeriodStart: "2026-06-14T00:00:00.000Z",
      currentPeriodEnd: "2026-07-14T00:00:00.000Z",
      cancelAtPeriodEnd: false,
      changeType: "upgrade",
      entitlements: { planCode: "growth" },
      updatedAt: "2026-06-14T12:00:00.000Z",
    });

    const { PATCH } = await import("../saas-admin/accounts/[id]/subscription/route");
    const response = await PATCH(
      ownerRequest("http://localhost/api/v1/saas-admin/accounts/org-1/subscription", {
        method: "PATCH",
        body: JSON.stringify({
          planCode: "growth",
          activatePaid: true,
          billingCycle: "monthly",
        }),
      }),
      { params: Promise.resolve({ id: "org-1" }) },
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ planCode: string }>(response);
    expect(body.planCode).toBe("growth");
    expect(updateSaasAccountSubscription).toHaveBeenCalledWith(expect.objectContaining({
      actorUserId: TEST_OWNER_USER_ID,
      organizationId: "org-1",
      planCode: "growth",
      activatePaid: true,
      billingCycle: "monthly",
    }));
  });

  it("returns validation error when organization id is missing", async () => {
    const { PATCH } = await import("../saas-admin/accounts/[id]/subscription/route");
    const response = await PATCH(
      ownerRequest("http://localhost/api/v1/saas-admin/accounts/org-1/subscription", {
        method: "PATCH",
        body: JSON.stringify({ planCode: "starter" }),
      }),
      { params: Promise.resolve({ id: "" }) },
    );

    expect(response.status).toBe(400);
    expect(updateSaasAccountSubscription).not.toHaveBeenCalled();
  });
});
