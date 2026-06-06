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

describe("summary month route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    getStorePeriodSummary.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("GET requires month query param", async () => {
    const { GET } = await import("../stores/[storeId]/summary/month/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/summary/month`),
      routeStoreContext(),
    );

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(getStorePeriodSummary).not.toHaveBeenCalled();
  });

  it("GET rejects invalid month format", async () => {
    const { GET } = await import("../stores/[storeId]/summary/month/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/summary/month?month=2026-13`),
      routeStoreContext(),
    );

    expect(response.status).toBe(400);
    expect(getStorePeriodSummary).not.toHaveBeenCalled();
  });

  it("GET returns month summary", async () => {
    getStorePeriodSummary.mockResolvedValueOnce({
      storeId: TEST_STORE_ID,
      from: "2026-06-01",
      to: "2026-06-30",
      totalSales: { amountHalalas: 500000, currency: "SAR" },
      totalOutflow: { amountHalalas: 120000, currency: "SAR" },
      netMovement: { amountHalalas: 380000, currency: "SAR" },
    });

    const { GET } = await import("../stores/[storeId]/summary/month/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/summary/month?month=2026-06`),
      routeStoreContext(),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ month: string; totalSales: { amountHalalas: number } }>(response);
    expect(body.month).toBe("2026-06");
    expect(body.totalSales.amountHalalas).toBe(500000);
    expect(getStorePeriodSummary).toHaveBeenCalledWith(expect.objectContaining({
      storeId: TEST_STORE_ID,
      from: "2026-06-01",
      to: "2026-06-30",
      actorRole: "owner",
    }));
  });

  it("GET surfaces server validation errors", async () => {
    getStorePeriodSummary.mockRejectedValueOnce(new ValidationError("Invalid period summary request."));

    const { GET } = await import("../stores/[storeId]/summary/month/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/summary/month?month=2026-06`),
      routeStoreContext(),
    );

    expect(response.status).toBe(400);
    expect(getStorePeriodSummary).toHaveBeenCalledOnce();
  });
});
