import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetEnvCacheForTests } from "@/core/config/env";
import {
  ownerRequest,
  readJsonBody,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
} from "./helpers";

const getSaasOverviewKpis = vi.fn();
const listSaasOrganizations = vi.fn();

vi.mock("@/features/saas-admin/server/get-saas-overview-kpis", () => ({
  getSaasOverviewKpis,
}));

vi.mock("@/features/saas-admin/server/list-saas-organizations", () => ({
  listSaasOrganizations,
}));

describe("saas admin routes integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    process.env.SAAS_ADMIN_API_ENABLED = "false";
    process.env.SAAS_PLATFORM_ADMIN_USER_IDS = "";
    __resetEnvCacheForTests();
    getSaasOverviewKpis.mockReset();
    listSaasOrganizations.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
    delete process.env.SAAS_ADMIN_API_ENABLED;
    delete process.env.SAAS_PLATFORM_ADMIN_USER_IDS;
  });

  it("GET /saas-admin/kpis/overview returns 503 when API flag is off", async () => {
    const { GET } = await import("../saas-admin/kpis/overview/route");
    const response = await GET(
      ownerRequest("http://localhost/api/v1/saas-admin/kpis/overview?from=2026-01-01&to=2026-12-31"),
    );

    expect(response.status).toBe(503);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("SERVICE_UNAVAILABLE");
    expect(getSaasOverviewKpis).not.toHaveBeenCalled();
  });

  it("GET /saas-admin/organizations returns 503 when API flag is off", async () => {
    const { GET } = await import("../saas-admin/organizations/route");
    const response = await GET(
      ownerRequest("http://localhost/api/v1/saas-admin/organizations?status=active"),
    );

    expect(response.status).toBe(503);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("SERVICE_UNAVAILABLE");
    expect(listSaasOrganizations).not.toHaveBeenCalled();
  });
});
