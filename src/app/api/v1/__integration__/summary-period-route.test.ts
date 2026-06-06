import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors/app-error";
import {
  ownerRequest,
  readJsonBody,
  routeStoreContext,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_STORE_ID,
} from "./helpers";

const getStorePeriodSummary = vi.fn();

vi.mock("@/features/reports/server/get-store-period-summary", () => ({
  getStorePeriodSummary,
}));

describe("summary period route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    getStorePeriodSummary.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("GET requires from and to query params", async () => {
    const { GET } = await import("../stores/[storeId]/summary/period/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/summary/period?from=2026-06-01`),
      routeStoreContext(),
    );

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(getStorePeriodSummary).not.toHaveBeenCalled();
  });

  it("GET returns bounded period summary", async () => {
    getStorePeriodSummary.mockResolvedValueOnce({
      storeId: TEST_STORE_ID,
      from: "2026-06-01",
      to: "2026-06-15",
      totalSales: { amountHalalas: 220000, currency: "SAR" },
      totalOutflow: { amountHalalas: 45000, currency: "SAR" },
      netMovement: { amountHalalas: 175000, currency: "SAR" },
    });

    const { GET } = await import("../stores/[storeId]/summary/period/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/summary/period?from=2026-06-01&to=2026-06-15`),
      routeStoreContext(),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ from: string; to: string }>(response);
    expect(body.from).toBe("2026-06-01");
    expect(body.to).toBe("2026-06-15");
    expect(getStorePeriodSummary).toHaveBeenCalledWith(expect.objectContaining({
      storeId: TEST_STORE_ID,
      from: "2026-06-01",
      to: "2026-06-15",
      actorRole: "owner",
    }));
  });

  it("GET surfaces server validation errors", async () => {
    getStorePeriodSummary.mockRejectedValueOnce(new ValidationError("from and to must be YYYY-MM-DD."));

    const { GET } = await import("../stores/[storeId]/summary/period/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/summary/period?from=2026-06-01&to=2026-06-15`),
      routeStoreContext(),
    );

    expect(response.status).toBe(400);
    expect(getStorePeriodSummary).toHaveBeenCalledOnce();
  });
});
