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

  it("accepts legacy actor and store ids for mapping checks", async () => {
    setMapsEnv();
    const {
      hasCloseoutApiActorMapping,
      hasCloseoutApiStoreMapping,
    } = await import("./closeouts-api-client.js");
    expect(hasCloseoutApiActorMapping("ahmed")).toBe(true);
    expect(hasCloseoutApiStoreMapping("shami")).toBe(true);
    expect(hasCloseoutApiActorMapping("unknown")).toBe(false);
    expect(hasCloseoutApiStoreMapping("unknown")).toBe(false);
  });

  it("submits mada channel using catalog default uuid", async () => {
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
        id: "closeout-mada",
        storeId: "shami",
        date: "2026-06-06",
        sales: [{ channelId: "mada", name: "Mada", amount: 250 }],
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.lastCall!;
    const payload = JSON.parse(String(init?.body ?? "{}"));
    expect(payload.salesChannels[0].salesChannelId).toBe("7c3a1f2e-8b4d-4e9a-a1c2-3d4e5f6a7b8c");
    expect(payload.salesChannels[0].amountHalalas).toBe(25000);
  });

  it("diagnoses unmapped custom sales channels", async () => {
    process.env.NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP = JSON.stringify({
      shami: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
    });
    process.env.NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP = JSON.stringify({
      ahmed: "4cf1450d-08d8-4ca1-b180-1c2642174a79",
    });
    process.env.NEXT_PUBLIC_CLOSEOUTS_SALES_CHANNEL_ID_MAP = "{}";

    const { diagnoseCloseoutSubmitFailure, setRuntimeApiIdMaps } = await import("./closeouts-api-client.js");
    setRuntimeApiIdMaps({
      storeIdMap: { shami: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c" },
      userIdMap: { ahmed: "4cf1450d-08d8-4ca1-b180-1c2642174a79" },
      salesChannelIdMap: { cash: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb" },
    });

    const failure = diagnoseCloseoutSubmitFailure({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "ahmed",
      closeout: {
        storeId: "shami",
        sales: { custom: { channelId: "custom-pos-99", name: "POS", amount: 100 } },
      },
    });

    expect(failure?.code).toBe("unmapped_sales_channels");
    expect(failure?.unmappedChannels?.[0]?.channelId).toBe("custom-pos-99");
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

  it("fetches mapped closeouts list for store", async () => {
    setMapsEnv();
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async () => new Response(JSON.stringify([{
        id: "c-1",
        storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
        openedByUserId: "4cf1450d-08d8-4ca1-b180-1c2642174a79",
        submittedByUserId: "4cf1450d-08d8-4ca1-b180-1c2642174a79",
        sales: [
          {
            channelId: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
            name: "Cash",
            amount: 120,
          },
        ],
      }]), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchStoreCloseoutsViaApi } = await import("./closeouts-api-client.js");
    const result = await fetchStoreCloseoutsViaApi({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "owner",
      actorRole: "owner",
      storeId: "shami",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-30",
    });

    expect(result).toEqual([{
      id: "c-1",
      storeId: "shami",
      openedByUserId: "ahmed",
      submittedByUserId: "ahmed",
      sales: [
        {
          channelId: "cash",
          name: "Cash",
          amount: 120,
        },
      ],
    }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.lastCall!;
    expect(String(url)).toContain("/api/v1/stores/302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c/closeouts");
    expect(String(url)).toContain("dateFrom=2026-06-01");
    expect(String(url)).toContain("dateTo=2026-06-30");
    expect(init?.headers).toMatchObject({
      "x-organization-id": "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      "x-member-role": "owner",
    });
  });
});
