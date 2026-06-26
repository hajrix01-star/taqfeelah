import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

describe("fetchStoreAttachmentViaApi", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP: JSON.stringify({
        shami: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      }),
      NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP: JSON.stringify({
        owner: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      }),
    };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it("maps local store ids before requesting attachment bytes", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      id: "22222222-2222-4222-8222-222222222222",
      dataUrl: "data:image/jpeg;base64,abc",
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { fetchStoreAttachmentViaApi } = await import("./closeout-attachments-api-client");
    const payload = await fetchStoreAttachmentViaApi({
      organizationId: "11111111-1111-4111-8111-111111111111",
      actorUserId: "owner",
      actorRole: "owner",
      storeId: "shami",
      attachmentId: "22222222-2222-4222-8222-222222222222",
    });

    expect(payload.dataUrl).toBe("data:image/jpeg;base64,abc");
    const calls = fetchMock.mock.calls as unknown as Array<[string]>;
    expect(calls[0]?.[0]).toContain(
      "/api/v1/stores/302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c/attachments/22222222-2222-4222-8222-222222222222",
    );
  });
});
