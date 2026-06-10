import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ownerRequest,
  readJsonBody,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_STORE_ID,
} from "./helpers";

const getStoreAttachment = vi.fn();

vi.mock("@/features/closeouts/server/get-store-attachment", () => ({
  getStoreAttachment,
}));

const TEST_ATTACHMENT_ID = "22222222-2222-4222-8222-222222222222";

describe("store attachment route", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    getStoreAttachment.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("GET returns attachment payload", async () => {
    getStoreAttachment.mockResolvedValueOnce({
      id: TEST_ATTACHMENT_ID,
      name: "proof.png",
      mimeType: "image/png",
      sizeBytes: 95,
      dataUrl: "data:image/png;base64,abc",
    });

    const { GET } = await import("../stores/[storeId]/attachments/[attachmentId]/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/attachments/${TEST_ATTACHMENT_ID}`),
      { params: Promise.resolve({ storeId: TEST_STORE_ID, attachmentId: TEST_ATTACHMENT_ID }) },
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ dataUrl: string; id: string }>(response);
    expect(body.id).toBe(TEST_ATTACHMENT_ID);
    expect(body.dataUrl).toContain("data:image/png;base64,");
  });
});
