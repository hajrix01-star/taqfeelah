import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

function setMapsEnv() {
  process.env.NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP = JSON.stringify({
    shami: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
  });
  process.env.NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP = JSON.stringify({
    owner: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
  });
  process.env.NEXT_PUBLIC_CLOSEOUTS_SALES_CHANNEL_ID_MAP = JSON.stringify({
    cash: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
  });
}

describe("store entries api client", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it("fetches entries and remaps ids to runtime keys", async () => {
    setMapsEnv();
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async () => new Response(JSON.stringify({
        items: [{
          id: "entry-1",
          businessId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
          salesChannels: [
            {
              channelId: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
              name: "Cash",
              amount: 500,
            },
          ],
        }],
        nextCursor: null,
      }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchStoreEntriesViaApi } = await import("./store-entries-api-client");
    const result = await fetchStoreEntriesViaApi({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "owner",
      actorRole: "owner",
      storeId: "shami",
    });

    expect(result).toEqual([{
      id: "entry-1",
      businessId: "shami",
      salesChannels: [
        {
          channelId: "cash",
          name: "Cash",
          amount: 500,
        },
      ],
    }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.lastCall!;
    expect(String(url)).toContain("/api/v1/stores/302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c/entries");
    expect(String(url)).toContain("paginated=1");
  });

  it("creates entry using mapped store and channel IDs", async () => {
    setMapsEnv();
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async () => new Response(JSON.stringify({ id: "entry-2" }), { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { createStoreEntryViaApi } = await import("./store-entries-api-client");
    const result = await createStoreEntryViaApi({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "owner",
      actorRole: "owner",
      payload: {
        businessId: "shami",
        date: "2026-06-05",
        type: "summary",
        salesChannels: [{ channelId: "cash", name: "Cash", amount: 100 }],
      },
    });

    expect(result).toEqual({ id: "entry-2" });
    const [url, init] = fetchMock.mock.lastCall!;
    expect(String(url)).toContain("/api/v1/stores/302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c/entries");
    const body = JSON.parse(String(init?.body || "{}"));
    expect(body.salesChannels[0].salesChannelId).toBe("9bc40d4f-c773-4ba3-87db-b8bb1467dafb");
    expect(body.salesChannels[0].amountHalalas).toBe(10000);
    expect(body.amountHalalas).toBeUndefined();
  });

  it("fetches paginated entries and remaps ids to runtime keys", async () => {
    setMapsEnv();
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async () => new Response(JSON.stringify({
        items: [{
          id: "entry-3",
          businessId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
          salesChannels: [],
        }],
        nextCursor: "cursor-2",
      }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchStoreEntriesPageViaApi } = await import("./store-entries-api-client");
    const result = await fetchStoreEntriesPageViaApi({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "owner",
      actorRole: "owner",
      storeId: "shami",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-30",
      cursor: "cursor-1",
      limit: 50,
    });

    expect(result.items).toEqual([{
      id: "entry-3",
      businessId: "shami",
      salesChannels: [],
    }]);
    expect(result.nextCursor).toBe("cursor-2");
    const [url] = fetchMock.mock.lastCall!;
    expect(String(url)).toContain("paginated=1");
    expect(String(url)).toContain("cursor=cursor-1");
    expect(String(url)).toContain("dateFrom=2026-06-01");
  });

  it("aggregates multiple pages and stops when nextCursor is empty", async () => {
    setMapsEnv();
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async (input) => {
        const url = String(input);
        if (url.includes("cursor=cursor-1")) {
          return new Response(JSON.stringify({
            items: [{
              id: "entry-2",
              businessId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
              salesChannels: [],
            }],
            nextCursor: null,
          }), { status: 200 });
        }

        return new Response(JSON.stringify({
          items: [{
            id: "entry-1",
            businessId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
            salesChannels: [],
          }],
          nextCursor: "cursor-1",
        }), { status: 200 });
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchStoreEntriesViaApi } = await import("./store-entries-api-client");
    const result = await fetchStoreEntriesViaApi({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "owner",
      actorRole: "owner",
      storeId: "shami",
      limit: 100,
    });

    expect(result.map((entry) => entry.id)).toEqual(["entry-1", "entry-2"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws when pagination does not terminate within safety bound", async () => {
    setMapsEnv();
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async () => new Response(JSON.stringify({
        items: [{
          id: "entry-loop",
          businessId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
          salesChannels: [],
        }],
        nextCursor: "cursor-loop",
      }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchStoreEntriesViaApi } = await import("./store-entries-api-client");
    await expect(fetchStoreEntriesViaApi({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "owner",
      actorRole: "owner",
      storeId: "shami",
      limit: 100,
    })).rejects.toThrow("pagination exceeded safety limit");

    expect(fetchMock).toHaveBeenCalledTimes(500);
  });

  it("throws a diagnostic error when entries context mapping is missing", async () => {
    process.env.NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP = "{}";
    process.env.NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP = "{}";
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
    vi.stubGlobal("fetch", fetchMock);

    const { fetchStoreEntriesPageViaApi } = await import("./store-entries-api-client");

    await expect(fetchStoreEntriesPageViaApi({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "owner",
      actorRole: "owner",
      storeId: "shami",
    })).rejects.toThrow("entries page API context missing/invalid");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when entries page payload is invalid instead of returning an empty list", async () => {
    setMapsEnv();
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async () => new Response(JSON.stringify({ rows: [] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchStoreEntriesViaApi } = await import("./store-entries-api-client");

    await expect(fetchStoreEntriesViaApi({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "owner",
      actorRole: "owner",
      storeId: "shami",
    })).rejects.toThrow("entries page API returned invalid payload");
  });
});
