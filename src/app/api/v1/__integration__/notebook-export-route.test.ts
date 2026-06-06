import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors/app-error";
import {
  ownerRequest,
  readJsonBody,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_STORE_ID,
} from "./helpers";

const getNotebookExport = vi.fn();

vi.mock("@/features/exports/server/get-notebook-export", () => ({
  getNotebookExport,
}));

describe("notebook export route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    getNotebookExport.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("GET requires storeId query param", async () => {
    const { GET } = await import("../exports/notebook/route");
    const response = await GET(ownerRequest("http://localhost/api/v1/exports/notebook?date=2026-06-05"));

    expect(response.status).toBe(400);
    expect(getNotebookExport).not.toHaveBeenCalled();
  });

  it("GET rejects invalid period query", async () => {
    const { GET } = await import("../exports/notebook/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/exports/notebook?storeId=${TEST_STORE_ID}&period=week&date=2026-06-05`),
    );

    expect(response.status).toBe(400);
    expect(getNotebookExport).not.toHaveBeenCalled();
  });

  it("GET returns notebook export for day period", async () => {
    getNotebookExport.mockResolvedValueOnce({
      storeId: TEST_STORE_ID,
      from: "2026-06-05",
      to: "2026-06-05",
      days: [{ date: "2026-06-05", totalSalesHalalas: 120000 }],
    });

    const { GET } = await import("../exports/notebook/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/exports/notebook?storeId=${TEST_STORE_ID}&period=day&date=2026-06-05`),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ days: Array<{ date: string }> }>(response);
    expect(body.days).toHaveLength(1);
    expect(getNotebookExport).toHaveBeenCalledWith(expect.objectContaining({
      storeId: TEST_STORE_ID,
      from: "2026-06-05",
      to: "2026-06-05",
      period: "day",
      actorRole: "owner",
    }));
  });

  it("GET returns notebook export for month period", async () => {
    getNotebookExport.mockResolvedValueOnce({
      storeId: TEST_STORE_ID,
      from: "2026-06-01",
      to: "2026-06-30",
      days: [],
    });

    const { GET } = await import("../exports/notebook/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/exports/notebook?storeId=${TEST_STORE_ID}&period=month&month=2026-06`),
    );

    expect(response.status).toBe(200);
    expect(getNotebookExport).toHaveBeenCalledWith(expect.objectContaining({
      from: "2026-06-01",
      to: "2026-06-30",
      period: "month",
    }));
  });

  it("GET surfaces server validation errors", async () => {
    getNotebookExport.mockRejectedValueOnce(new ValidationError("Invalid notebook export request."));

    const { GET } = await import("../exports/notebook/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/exports/notebook?storeId=${TEST_STORE_ID}&period=day&date=2026-06-05`),
    );

    expect(response.status).toBe(400);
    expect(getNotebookExport).toHaveBeenCalledOnce();
  });
});
