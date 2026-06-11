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

vi.mock("@/features/saas-admin/server/get-saas-overview", () => ({
  getSaasOverview,
}));

vi.mock("@/features/saas-admin/server/get-saas-accounts", () => ({
  getSaasAccounts,
}));

describe("saas admin routes integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    process.env.SAAS_ADMIN_API_ENABLED = "false";
    process.env.SAAS_PLATFORM_ADMIN_USER_IDS = "";
    __resetEnvCacheForTests();
    getSaasOverview.mockReset();
    getSaasAccounts.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
    delete process.env.SAAS_ADMIN_API_ENABLED;
    delete process.env.SAAS_PLATFORM_ADMIN_USER_IDS;
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
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("SERVICE_UNAVAILABLE");
    expect(getSaasAccounts).not.toHaveBeenCalled();
  });
});
