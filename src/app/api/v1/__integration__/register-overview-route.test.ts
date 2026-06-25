import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ownerRequest,
  readJsonBody,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_ORGANIZATION_ID,
  TEST_OWNER_USER_ID,
  TEST_STORE_ID,
} from "./helpers";

const getRegisterOverview = vi.fn();

vi.mock("@/features/entries/server/get-register-overview", () => ({
  getRegisterOverview,
}));

describe("register overview route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    getRegisterOverview.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("GET requires storeIds query param", async () => {
    const { GET } = await import("../register/overview/route");
    const response = await GET(
      ownerRequest("http://localhost/api/v1/register/overview?from=2026-06-01&to=2026-06-30"),
    );

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(getRegisterOverview).not.toHaveBeenCalled();
  });

  it("GET returns combined register totals and closeouts", async () => {
    getRegisterOverview.mockResolvedValueOnce({
      from: "2026-06-01",
      to: "2026-06-30",
      period: "month",
      storeIds: [TEST_STORE_ID],
      totalsByStoreId: {
        [TEST_STORE_ID]: {
          storeId: TEST_STORE_ID,
          totalSales: { amountHalalas: 220000, currency: "SAR" },
          totalOutflow: { amountHalalas: 45000, currency: "SAR" },
          netMovement: { amountHalalas: 175000, currency: "SAR" },
        },
      },
      closeouts: [{ id: "closeout-1", storeId: TEST_STORE_ID, date: "2026-06-05" }],
    });

    const { GET } = await import("../register/overview/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/register/overview?storeIds=${TEST_STORE_ID}&period=month&month=2026-06`),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{
      from: string;
      to: string;
      closeouts: Array<{ id: string }>;
      totalsByStoreId: Record<string, unknown>;
    }>(response);
    expect(body.from).toBe("2026-06-01");
    expect(body.to).toBe("2026-06-30");
    expect(body.closeouts).toHaveLength(1);
    expect(body.totalsByStoreId[TEST_STORE_ID]).toBeTruthy();
    expect(getRegisterOverview).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: TEST_ORGANIZATION_ID,
      actorUserId: TEST_OWNER_USER_ID,
      actorRole: "owner",
      storeIds: [TEST_STORE_ID],
      from: "2026-06-01",
      to: "2026-06-30",
      period: "month",
    }));
  });
});
