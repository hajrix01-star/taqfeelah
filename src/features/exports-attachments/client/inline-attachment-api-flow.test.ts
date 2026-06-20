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

describe("inline attachment api flow", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.unstubAllGlobals();
  });

  it("registers inline attachment and returns storageKey on payload", async () => {
    setMapsEnv();
    const fetchMock = vi.fn(async (url) => {
      if (String(url).includes("/attachments/inline")) {
        return new Response(JSON.stringify({
          storageKey: "inline:v1:abc:data:image/jpeg;base64,abc",
          name: "receipt.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 1200,
        }), { status: 201 });
      }
      return new Response(JSON.stringify({}), { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { resolveInlineAttachmentPayloadForApi } = await import("./inline-attachment-api-flow.js");
    const result = await resolveInlineAttachmentPayloadForApi({
      enabled: true,
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "owner",
      actorRole: "owner",
      storeId: "shami",
      payload: {
        businessId: "shami",
        attachment: {
          name: "receipt.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 1200,
          dataUrl: "data:image/jpeg;base64,abc",
        },
      },
    });

    expect(result?.attachment?.storageKey).toContain("inline:v1:");
    expect(result?.attachment?.dataUrl).toBeUndefined();
    expect(fetchMock).toHaveBeenCalled();
  });

  it("returns payload unchanged when exports-attachments flow is disabled", async () => {
    const { resolveInlineAttachmentPayloadForApi } = await import("./inline-attachment-api-flow.js");
    const payload = {
      attachment: { dataUrl: "data:image/jpeg;base64,abc", sizeBytes: 10 },
    };
    const result = await resolveInlineAttachmentPayloadForApi({
      enabled: false,
      payload,
    });
    expect(result).toEqual(payload);
  });
});
