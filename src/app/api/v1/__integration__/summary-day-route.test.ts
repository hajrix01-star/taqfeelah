import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ownerRequest,
  readJsonBody,
  routeStoreContext,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_STORE_ID,
} from "./helpers";

const getStoreDaySummary = vi.fn();
const recordStoreDaySummarySnapshot = vi.fn();

vi.mock("@/features/reports/server/get-store-day-summary", () => ({
  getStoreDaySummary,
}));

vi.mock("@/features/reports/server/record-store-day-summary-snapshot", () => ({
  recordStoreDaySummarySnapshot,
}));

describe("summary day route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    getStoreDaySummary.mockReset();
    recordStoreDaySummarySnapshot.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("GET requires date query param", async () => {
    const { GET } = await import("../stores/[storeId]/summary/day/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/summary/day`),
      routeStoreContext(),
    );

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("GET returns computed day summary", async () => {
    getStoreDaySummary.mockResolvedValueOnce({
      storeId: TEST_STORE_ID,
      date: "2026-06-05",
      totalSales: { amountHalalas: 120000, currency: "SAR" },
      totalOutflow: { amountHalalas: 25000, currency: "SAR" },
      netMovement: { amountHalalas: 95000, currency: "SAR" },
      outflowRatio: "20.8%",
      outflowRatioStatus: "calculable",
      attachmentCount: 1,
    });

    const { GET } = await import("../stores/[storeId]/summary/day/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/summary/day?date=2026-06-05`),
      routeStoreContext(),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ totalSales: { amountHalalas: number } }>(response);
    expect(body.totalSales.amountHalalas).toBe(120000);
  });

  it("POST rejects invalid totalSalesHalalas body field", async () => {
    const { POST } = await import("../stores/[storeId]/summary/day/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/summary/day?date=2026-06-05`, {
        method: "POST",
        body: JSON.stringify({ totalSalesHalalas: 12.5, totalOutflowHalalas: 25000 }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(400);
    expect(recordStoreDaySummarySnapshot).not.toHaveBeenCalled();
  });

  it("POST records snapshot through verified service path", async () => {
    recordStoreDaySummarySnapshot.mockResolvedValueOnce({
      id: "audit-1",
      createdAt: new Date("2026-06-05T10:00:00Z"),
    });
    getStoreDaySummary.mockResolvedValueOnce({
      storeId: TEST_STORE_ID,
      date: "2026-06-05",
      totalSales: { amountHalalas: 120000, currency: "SAR" },
      totalOutflow: { amountHalalas: 25000, currency: "SAR" },
      netMovement: { amountHalalas: 95000, currency: "SAR" },
      outflowRatio: "20.8%",
      outflowRatioStatus: "calculable",
      attachmentCount: 0,
    });

    const { POST } = await import("../stores/[storeId]/summary/day/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/summary/day?date=2026-06-05`, {
        method: "POST",
        body: JSON.stringify({ totalSalesHalalas: 120000, totalOutflowHalalas: 25000 }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(201);
    expect(recordStoreDaySummarySnapshot).toHaveBeenCalledWith(expect.objectContaining({
      totalSalesHalalas: 120000,
      totalOutflowHalalas: 25000,
    }));
  });
});
