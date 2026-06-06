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

describe("phase9 api client", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it("approves duplicate summary using mapped store and channel IDs", async () => {
    setMapsEnv();
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async () => new Response(JSON.stringify({ id: "entry-dup-1" }), { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { approveDuplicateSummaryViaApi } = await import("./phase9-api-client.js");
    const result = await approveDuplicateSummaryViaApi({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "owner",
      actorRole: "owner",
      storeId: "shami",
      date: "2026-06-05",
      payload: {
        salesChannels: [{ channelId: "cash", name: "Cash", amount: 120 }],
        note: "duplicate ok",
      },
    });

    expect(result).toEqual({ id: "entry-dup-1" });
    const [url, init] = fetchMock.mock.lastCall!;
    expect(String(url)).toContain("/api/v1/stores/302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c/entries/duplicate-summary/approve");
    const body = JSON.parse(String(init?.body || "{}"));
    expect(body.date).toBe("2026-06-05");
    expect(body.payload.salesChannels[0].salesChannelId).toBe("9bc40d4f-c773-4ba3-87db-b8bb1467dafb");
    expect(body.payload.salesChannels[0].amountHalalas).toBe(12000);
  });

  it("acknowledges duplicate summaries with entry IDs", async () => {
    setMapsEnv();
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async () => new Response(JSON.stringify({
        acknowledgedEntryIds: ["11111111-1111-4111-8111-111111111111"],
        date: "2026-06-05",
      }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { acknowledgeDuplicateSummariesViaApi } = await import("./phase9-api-client.js");
    const result = await acknowledgeDuplicateSummariesViaApi({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "owner",
      actorRole: "owner",
      storeId: "shami",
      date: "2026-06-05",
      entryIds: ["11111111-1111-4111-8111-111111111111"],
    });

    expect((result as { acknowledgedEntryIds: string[] }).acknowledgedEntryIds).toHaveLength(1);
    const [url] = fetchMock.mock.lastCall!;
    expect(String(url)).toContain("/entries/duplicate-summary/acknowledge");
  });

  it("fetches notebook export and remaps store id", async () => {
    setMapsEnv();
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async () => new Response(JSON.stringify({
        storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
        period: "day",
        from: "2026-06-05",
        to: "2026-06-05",
        totals: { sales: 100, expense: 20, net: 80 },
        channels: [],
        operations: [],
      }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchNotebookExportViaApi } = await import("./phase9-api-client.js");
    const result = await fetchNotebookExportViaApi({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "owner",
      actorRole: "owner",
      storeId: "shami",
      period: "day",
      date: "2026-06-05",
    });

    expect(result?.storeId).toBe("shami");
    const [url] = fetchMock.mock.lastCall!;
    expect(String(url)).toContain("/api/v1/exports/notebook");
  });
});
