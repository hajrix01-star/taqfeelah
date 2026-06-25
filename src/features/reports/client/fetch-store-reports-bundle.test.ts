import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchStoreReportsBundle } from "./fetch-store-reports-bundle";

const api = vi.hoisted(() => ({
  fetchStorePeriodSummaryViaApi: vi.fn(),
  fetchStoreDaysReportViaApi: vi.fn(),
  fetchStoreChannelsReportViaApi: vi.fn(),
  fetchStoreOutflowReportViaApi: vi.fn(),
  fetchStoreAttachmentsReportViaApi: vi.fn(),
}));

vi.mock("./store-reports-api-client", () => ({
  fetchStorePeriodSummaryViaApi: api.fetchStorePeriodSummaryViaApi,
  fetchStoreDaysReportViaApi: api.fetchStoreDaysReportViaApi,
  fetchStoreChannelsReportViaApi: api.fetchStoreChannelsReportViaApi,
  fetchStoreOutflowReportViaApi: api.fetchStoreOutflowReportViaApi,
  fetchStoreAttachmentsReportViaApi: api.fetchStoreAttachmentsReportViaApi,
  getReportsApiMaps: () => ({ salesChannelIdMap: {} }),
}));

describe("fetchStoreReportsBundle", () => {
  beforeEach(() => {
    api.fetchStorePeriodSummaryViaApi.mockReset();
    api.fetchStoreDaysReportViaApi.mockReset();
    api.fetchStoreChannelsReportViaApi.mockReset();
    api.fetchStoreOutflowReportViaApi.mockReset();
    api.fetchStoreAttachmentsReportViaApi.mockReset();
  });

  it("combines day report rows for all stores when details are requested", async () => {
    api.fetchStorePeriodSummaryViaApi
      .mockResolvedValueOnce({
        totalSales: { amountHalalas: 10000 },
        totalOutflow: { amountHalalas: 2000 },
        netMovement: { amountHalalas: 8000 },
      })
      .mockResolvedValueOnce({
        totalSales: { amountHalalas: 30000 },
        totalOutflow: { amountHalalas: 5000 },
        netMovement: { amountHalalas: 25000 },
      });
    api.fetchStoreDaysReportViaApi
      .mockResolvedValueOnce({
        days: [
          {
            date: "2026-06-02",
            totalSales: { amountHalalas: 10000 },
            totalOutflow: { amountHalalas: 2000 },
            netMovement: { amountHalalas: 8000 },
          },
        ],
      })
      .mockResolvedValueOnce({
        days: [
          {
            date: "2026-06-02",
            totalSales: { amountHalalas: 30000 },
            totalOutflow: { amountHalalas: 5000 },
            netMovement: { amountHalalas: 25000 },
          },
          {
            date: "2026-06-01",
            totalSales: { amountHalalas: 7000 },
            totalOutflow: { amountHalalas: 1000 },
            netMovement: { amountHalalas: 6000 },
          },
        ],
      });

    const bundle = await fetchStoreReportsBundle({
      organizationId: "org-1",
      actorUserId: "user-1",
      actorRole: "owner",
      storeIds: ["store-1", "store-2"],
      dateRange: { from: "2026-06-01", to: "2026-06-30" },
      period: "month",
      configuredChannels: [],
      outflowCategory: "all",
      includeOutflowTransactions: false,
      includeDetails: true,
    });

    expect(api.fetchStoreDaysReportViaApi).toHaveBeenCalledTimes(2);
    expect(api.fetchStoreChannelsReportViaApi).not.toHaveBeenCalled();
    expect(api.fetchStoreOutflowReportViaApi).not.toHaveBeenCalled();
    expect(api.fetchStoreAttachmentsReportViaApi).not.toHaveBeenCalled();
    expect(bundle.daysRows).toEqual([
      expect.objectContaining({
        id: "2026-06-02",
        sales: 400,
        expense: 70,
        net: 330,
      }),
      expect.objectContaining({
        id: "2026-06-01",
        sales: 70,
        expense: 10,
        net: 60,
      }),
    ]);
  });
});
