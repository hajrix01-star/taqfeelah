import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetEnvCacheForTests } from "@/core/config/env";
import {
  ownerRequest,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
} from "./helpers";

const scanSubscriptionRenewals = vi.fn();

vi.mock("@/features/billing/server/scan-subscription-renewals", () => ({
  scanSubscriptionRenewals,
}));

describe("saas admin subscription scan route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    process.env.SAAS_ADMIN_API_ENABLED = "false";
    __resetEnvCacheForTests();
    scanSubscriptionRenewals.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
    delete process.env.SAAS_ADMIN_API_ENABLED;
  });

  it("POST subscriptions/scan returns 503 when API flag is off", async () => {
    const { POST } = await import("../saas-admin/subscriptions/scan/route");
    const response = await POST(
      ownerRequest("http://localhost/api/v1/saas-admin/subscriptions/scan", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(503);
    expect(scanSubscriptionRenewals).not.toHaveBeenCalled();
  });
});
