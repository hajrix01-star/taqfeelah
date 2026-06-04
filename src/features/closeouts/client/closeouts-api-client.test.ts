import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

function setMapsEnv() {
  process.env.NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP = JSON.stringify({
    shami: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
  });
  process.env.NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP = JSON.stringify({
    owner: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
    ahmed: "4cf1450d-08d8-4ca1-b180-1c2642174a79",
  });
  process.env.NEXT_PUBLIC_CLOSEOUTS_SALES_CHANNEL_ID_MAP = JSON.stringify({
    cash: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
  });
}

describe("closeouts api client", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it("submits mapped payload using legacy IDs", async () => {
    setMapsEnv();
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async () => new Response(JSON.stringify({ ok: true }), { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { submitCloseoutViaApi } = await import("./closeouts-api-client.js");

    await submitCloseoutViaApi({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "ahmed",
      actorRole: "employee",
      closeout: {
        id: "closeout-1",
        storeId: "shami",
        date: "2026-06-04",
        note: "daily",
        sales: [{ id: "cash", name: "Cash", amount: 123.45 }],
        outflows: [{ type: "expense", amount: 10, note: "tea" }],
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.lastCall!;
    expect(url).toContain("/api/v1/stores/302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c/closeouts");
    const payload = JSON.parse(String(init?.body ?? "{}"));
    expect(payload.mode).toBe("submit");
    expect(payload.salesChannels[0].salesChannelId).toBe("9bc40d4f-c773-4ba3-87db-b8bb1467dafb");
    expect(payload.salesChannels[0].amountHalalas).toBe(12345);
    expect(payload.outflows[0].amountHalalas).toBe(1000);
  });

  it("returns null when required UUID mapping is missing", async () => {
    process.env.NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP = "{}";
    process.env.NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP = "{}";
    process.env.NEXT_PUBLIC_CLOSEOUTS_SALES_CHANNEL_ID_MAP = "{}";
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
    vi.stubGlobal("fetch", fetchMock);

    const { submitCloseoutViaApi } = await import("./closeouts-api-client.js");
    const result = await submitCloseoutViaApi({
      organizationId: "not-a-uuid",
      actorUserId: "unknown",
      actorRole: "employee",
      closeout: {
        id: "closeout-1",
        storeId: "shami",
        date: "2026-06-04",
        sales: [{ id: "cash", amount: 100 }],
      },
    });

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
