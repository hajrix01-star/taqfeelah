import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetEnvCacheForTests } from "@/core/config/env";
import {
  ownerRequest,
  readJsonBody,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
} from "./helpers";

const getInvestorDashboard = vi.fn();
const listSaasOrganizationAnalytics = vi.fn();
const aggregateSaasAnalytics = vi.fn();

vi.mock("@/features/saas-admin/server/get-investor-dashboard", () => ({
  getInvestorDashboard,
}));

vi.mock("@/features/saas-admin/server/list-saas-organization-analytics", () => ({
  listSaasOrganizationAnalytics,
}));

vi.mock("@/features/saas-admin/server/aggregate-saas-analytics", () => ({
  aggregateSaasAnalytics,
}));

describe("saas admin analytics routes integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    process.env.SAAS_ADMIN_API_ENABLED = "false";
    __resetEnvCacheForTests();
    getInvestorDashboard.mockReset();
    listSaasOrganizationAnalytics.mockReset();
    aggregateSaasAnalytics.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
    delete process.env.SAAS_ADMIN_API_ENABLED;
  });

  it("GET investor-dashboard returns 503 when API flag is off", async () => {
    const { GET } = await import("../saas-admin/analytics/investor-dashboard/route");
    const response = await GET(
      ownerRequest("http://localhost/api/v1/saas-admin/analytics/investor-dashboard?from=2026-06-01&to=2026-06-11"),
    );

    expect(response.status).toBe(503);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("SERVICE_UNAVAILABLE");
    expect(getInvestorDashboard).not.toHaveBeenCalled();
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
