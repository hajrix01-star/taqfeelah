import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetEnvCacheForTests } from "@/core/config/env";
import {
  ownerRequest,
  readJsonBody,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
} from "./helpers";

const getSaasOverview = vi.fn();
const getSaasAccounts = vi.fn();
const getSaasAccountDetails = vi.fn();
const getSaasUsage = vi.fn();
const getInvestorMetrics = vi.fn();
const getSystemHealth = vi.fn();

vi.mock("@/features/saas-admin/server/get-saas-overview", () => ({
  getSaasOverview,
}));

vi.mock("@/features/saas-admin/server/get-saas-accounts", () => ({
  getSaasAccounts,
}));

vi.mock("@/features/saas-admin/server/get-saas-account-details", () => ({
  getSaasAccountDetails,
}));

vi.mock("@/features/saas-admin/server/get-saas-usage", () => ({
  getSaasUsage,
}));

vi.mock("@/features/saas-admin/server/get-investor-metrics", () => ({
  getInvestorMetrics,
}));

vi.mock("@/features/saas-admin/server/get-system-health", () => ({
  getSystemHealth,
}));

describe("saas admin dashboard routes integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    process.env.SAAS_ADMIN_API_ENABLED = "false";
    __resetEnvCacheForTests();
    getSaasOverview.mockReset();
    getSaasAccounts.mockReset();
    getSaasAccountDetails.mockReset();
    getSaasUsage.mockReset();
    getInvestorMetrics.mockReset();
    getSystemHealth.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
    delete process.env.SAAS_ADMIN_API_ENABLED;
  });

  it("GET /saas-admin/overview returns 503 when API flag is off", async () => {
    const { GET } = await import("../saas-admin/overview/route");
    const response = await GET(ownerRequest("http://localhost/api/v1/saas-admin/overview"));
    expect(response.status).toBe(503);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("SERVICE_UNAVAILABLE");
    expect(getSaasOverview).not.toHaveBeenCalled();
  });

  it("GET /saas-admin/accounts returns 503 when API flag is off", async () => {
    const { GET } = await import("../saas-admin/accounts/route");
    const response = await GET(ownerRequest("http://localhost/api/v1/saas-admin/accounts"));
    expect(response.status).toBe(503);
    expect(getSaasAccounts).not.toHaveBeenCalled();
  });

  it("GET /saas-admin/accounts/[id] returns 503 when API flag is off", async () => {
    const { GET } = await import("../saas-admin/accounts/[id]/route");
    const response = await GET(
      ownerRequest("http://localhost/api/v1/saas-admin/accounts/org-1"),
      { params: Promise.resolve({ id: "org-1" }) },
    );
    expect(response.status).toBe(503);
    expect(getSaasAccountDetails).not.toHaveBeenCalled();
  });

  it("GET /saas-admin/usage returns 503 when API flag is off", async () => {
    const { GET } = await import("../saas-admin/usage/route");
    const response = await GET(ownerRequest("http://localhost/api/v1/saas-admin/usage"));
    expect(response.status).toBe(503);
    expect(getSaasUsage).not.toHaveBeenCalled();
  });

  it("GET /saas-admin/investor-metrics returns 503 when API flag is off", async () => {
    const { GET } = await import("../saas-admin/investor-metrics/route");
    const response = await GET(ownerRequest("http://localhost/api/v1/saas-admin/investor-metrics"));
    expect(response.status).toBe(503);
    expect(getInvestorMetrics).not.toHaveBeenCalled();
  });

  it("GET /saas-admin/system-health returns 503 when API flag is off", async () => {
    const { GET } = await import("../saas-admin/system-health/route");
    const response = await GET(ownerRequest("http://localhost/api/v1/saas-admin/system-health"));
    expect(response.status).toBe(503);
    expect(getSystemHealth).not.toHaveBeenCalled();
  });
});
