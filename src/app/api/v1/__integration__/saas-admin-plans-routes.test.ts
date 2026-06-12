import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __resetEnvCacheForTests } from "@/core/config/env";
import {
  ownerRequest,
  readJsonBody,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_OWNER_USER_ID,
} from "./helpers";

const listPlanCatalogRows = vi.fn();

vi.mock("@/features/billing/server/plan-catalog-repository", () => ({
  listPlanCatalogRows,
  upsertPlanCatalogRow: vi.fn(),
}));

describe("saas admin plans routes integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    process.env.SAAS_ADMIN_API_ENABLED = "true";
    process.env.SAAS_PLATFORM_ADMIN_USER_IDS = "";
    __resetEnvCacheForTests();
    listPlanCatalogRows.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
    delete process.env.SAAS_ADMIN_API_ENABLED;
    delete process.env.SAAS_PLATFORM_ADMIN_USER_IDS;
  });

  it("GET /saas-admin/plans allows authenticated owners when allowlist is empty", async () => {
    listPlanCatalogRows.mockResolvedValueOnce([
      {
        planCode: "starter",
        displayNameAr: "أساسية",
        displayNameEn: "Starter",
        priceMonthlyHalalas: 9_900,
        priceYearlyHalalas: 99_000,
        maxStores: 1,
        maxEmployees: 5,
        trialDays: 14,
        features: {},
        isActive: true,
        sortOrder: 1,
      },
    ]);

    const { GET } = await import("../saas-admin/plans/route");
    const response = await GET(ownerRequest("http://localhost/api/v1/saas-admin/plans"));

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ plans: Array<{ planCode: string }> }>(response);
    expect(body.plans[0]?.planCode).toBe("starter");
    expect(listPlanCatalogRows).toHaveBeenCalledTimes(1);
  });

  it("GET /saas-admin/plans returns 403 for employees outside the allowlist", async () => {
    process.env.SAAS_PLATFORM_ADMIN_USER_IDS = "11111111-1111-4111-8111-111111111111";
    __resetEnvCacheForTests();

    const { GET } = await import("../saas-admin/plans/route");
    const response = await GET(
      new Request("http://localhost/api/v1/saas-admin/plans", {
        headers: {
          "x-organization-id": "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
          "x-user-id": TEST_OWNER_USER_ID,
          "x-member-role": "employee",
        },
      }),
    );

    expect(response.status).toBe(403);
    const body = await readJsonBody<{ error: { message: string } }>(response);
    expect(body.error.message).toBe("User is not authorized for platform admin operations.");
    expect(listPlanCatalogRows).not.toHaveBeenCalled();
  });
});
