import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetEnvCacheForTests } from "@/core/config/env";
import {
  ownerRequest,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
} from "./helpers";

const aggregateSaasAnalytics = vi.fn();

vi.mock("@/features/saas-admin/server/aggregate-saas-analytics", () => ({
  aggregateSaasAnalytics,
}));

describe("saas admin analytics routes integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    process.env.SAAS_ADMIN_API_ENABLED = "false";
    __resetEnvCacheForTests();
    aggregateSaasAnalytics.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
    delete process.env.SAAS_ADMIN_API_ENABLED;
  });

  it("POST analytics/aggregate returns 503 when API flag is off", async () => {
    const { POST } = await import("../saas-admin/analytics/aggregate/route");
    const response = await POST(
      ownerRequest("http://localhost/api/v1/saas-admin/analytics/aggregate", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(503);
    expect(aggregateSaasAnalytics).not.toHaveBeenCalled();
  });
});
