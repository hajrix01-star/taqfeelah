import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors/app-error";
import {
  ownerRequest,
  readJsonBody,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_STORE_ID,
} from "./helpers";

const getStoreDaysReport = vi.fn();
const getStoreChannelsReport = vi.fn();
const getStoreOutflowReport = vi.fn();
const getStoreAttachmentsReport = vi.fn();

vi.mock("@/features/reports/server/get-store-days-report", () => ({
  getStoreDaysReport,
}));

vi.mock("@/features/reports/server/get-store-channels-report", () => ({
  getStoreChannelsReport,
}));

vi.mock("@/features/reports/server/get-store-outflow-report", () => ({
  getStoreOutflowReport,
}));

vi.mock("@/features/reports/server/get-store-attachments-report", () => ({
  getStoreAttachmentsReport,
}));

const reportQuery = `storeId=${TEST_STORE_ID}&from=2026-06-01&to=2026-06-15`;

describe("reports routes integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    getStoreDaysReport.mockReset();
    getStoreChannelsReport.mockReset();
    getStoreOutflowReport.mockReset();
    getStoreAttachmentsReport.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("days GET requires storeId", async () => {
    const { GET } = await import("../reports/days/route");
    const response = await GET(ownerRequest("http://localhost/api/v1/reports/days?from=2026-06-01&to=2026-06-15"));

    expect(response.status).toBe(400);
    expect(getStoreDaysReport).not.toHaveBeenCalled();
  });

  it("days GET returns store days report", async () => {
    getStoreDaysReport.mockResolvedValueOnce({
      storeId: TEST_STORE_ID,
      days: [{ date: "2026-06-05", totalSalesHalalas: 100000 }],
    });

    const { GET } = await import("../reports/days/route");
    const response = await GET(ownerRequest(`http://localhost/api/v1/reports/days?${reportQuery}`));

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ days: Array<{ date: string }> }>(response);
    expect(body.days).toHaveLength(1);
    expect(getStoreDaysReport).toHaveBeenCalledWith(expect.objectContaining({
      storeId: TEST_STORE_ID,
      from: "2026-06-01",
      to: "2026-06-15",
      actorRole: "owner",
    }));
  });

  it("channels GET returns store channels report", async () => {
    getStoreChannelsReport.mockResolvedValueOnce({
      storeId: TEST_STORE_ID,
      channels: [{ channelId: "cash", totalSalesHalalas: 80000 }],
    });

    const { GET } = await import("../reports/channels/route");
    const response = await GET(ownerRequest(`http://localhost/api/v1/reports/channels?${reportQuery}`));

    expect(response.status).toBe(200);
    expect(getStoreChannelsReport).toHaveBeenCalledOnce();
  });

  it("outflow GET forwards category filters to server", async () => {
    getStoreOutflowReport.mockResolvedValueOnce({
      storeId: TEST_STORE_ID,
      categories: [{ categoryKey: "rent", totalHalalas: 20000 }],
    });

    const { GET } = await import("../reports/outflow/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/reports/outflow?${reportQuery}&categoryKey=rent&includeTransactions=true`),
    );

    expect(response.status).toBe(200);
    expect(getStoreOutflowReport).toHaveBeenCalledWith(expect.objectContaining({
      categoryKey: "rent",
      includeTransactions: true,
    }));
  });

  it("attachments GET returns attachments report", async () => {
    getStoreAttachmentsReport.mockResolvedValueOnce({
      storeId: TEST_STORE_ID,
      attachments: [{ entryId: "entry-1", count: 1 }],
    });

    const { GET } = await import("../reports/attachments/route");
    const response = await GET(ownerRequest(`http://localhost/api/v1/reports/attachments?${reportQuery}`));

    expect(response.status).toBe(200);
    expect(getStoreAttachmentsReport).toHaveBeenCalledOnce();
  });

  it("days GET accepts month shorthand query", async () => {
    getStoreDaysReport.mockResolvedValueOnce({ storeId: TEST_STORE_ID, days: [] });

    const { GET } = await import("../reports/days/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/reports/days?storeId=${TEST_STORE_ID}&month=2026-06`),
    );

    expect(response.status).toBe(200);
    expect(getStoreDaysReport).toHaveBeenCalledWith(expect.objectContaining({
      from: "2026-06-01",
      to: "2026-06-30",
    }));
  });

  it("channels GET surfaces server validation errors", async () => {
    getStoreChannelsReport.mockRejectedValueOnce(new ValidationError("Invalid channels report request."));

    const { GET } = await import("../reports/channels/route");
    const response = await GET(ownerRequest(`http://localhost/api/v1/reports/channels?${reportQuery}`));

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
