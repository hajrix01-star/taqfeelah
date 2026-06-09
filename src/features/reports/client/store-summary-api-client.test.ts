import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

function setMapsEnv() {
  process.env.NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP = JSON.stringify({
    shami: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
  });
  process.env.NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP = JSON.stringify({
    owner: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
  });
}

describe("store summary api client", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it("fetches mapped day summary for legacy store id", async () => {
    setMapsEnv();
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async () => new Response(JSON.stringify({
        storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
        date: "2026-06-05",
        totalSales: { amountHalalas: 120000, currency: "SAR" },
        totalOutflow: { amountHalalas: 25000, currency: "SAR" },
        netMovement: { amountHalalas: 95000, currency: "SAR" },
        outflowRatio: "20.8%",
        outflowRatioStatus: "calculable",
        attachmentCount: 2,
        pendingReviewCount: 1,
      }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchStoreDaySummaryViaApi } = await import("./store-summary-api-client.js");
    const result = await fetchStoreDaySummaryViaApi({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "owner",
      actorRole: "owner",
      storeId: "shami",
      date: "2026-06-05",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.lastCall!;
    expect(url).toContain("/api/v1/stores/302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c/summary/day?date=2026-06-05");
    expect(init?.headers).toMatchObject({
      "x-organization-id": "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      "x-user-id": "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      "x-member-role": "owner",
    });
    expect(result?.totalSales?.amountHalalas).toBe(120000);
    expect(result?.attachmentCount).toBe(2);
  });

  it("fetches mapped month summary for legacy store id", async () => {
    setMapsEnv();
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async () => new Response(JSON.stringify({
        storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
        month: "2026-06",
        totalSales: { amountHalalas: 420000, currency: "SAR" },
        totalOutflow: { amountHalalas: 90000, currency: "SAR" },
        netMovement: { amountHalalas: 330000, currency: "SAR" },
        outflowRatio: "21.4%",
        outflowRatioStatus: "calculable",
        attachmentCount: 5,
        pendingReviewCount: 2,
      }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchStoreMonthSummaryViaApi } = await import("./store-summary-api-client.js");
    const result = await fetchStoreMonthSummaryViaApi({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "owner",
      actorRole: "owner",
      storeId: "shami",
      month: "2026-06",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.lastCall!;
    expect(url).toContain("/api/v1/stores/302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c/summary/month?month=2026-06");
    expect(result?.totalSales?.amountHalalas).toBe(420000);
    expect(result?.month).toBe("2026-06");
  });

  it("throws a diagnostic error when context mapping is missing", async () => {
    process.env.NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP = "{}";
    process.env.NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP = "{}";
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
    vi.stubGlobal("fetch", fetchMock);

    const { fetchStoreDaySummaryViaApi } = await import("./store-summary-api-client.js");

    await expect(fetchStoreDaySummaryViaApi({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "owner",
      actorRole: "owner",
      storeId: "shami",
      date: "2026-06-05",
    })).rejects.toThrow("day summary API context missing/invalid");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when summary payload is null instead of treating it as zero", async () => {
    setMapsEnv();
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async () => new Response("null", { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchStoreDaySummaryViaApi } = await import("./store-summary-api-client.js");

    await expect(fetchStoreDaySummaryViaApi({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "owner",
      actorRole: "owner",
      storeId: "shami",
      date: "2026-06-05",
    })).rejects.toThrow("day summary API returned invalid payload");
  });
});
