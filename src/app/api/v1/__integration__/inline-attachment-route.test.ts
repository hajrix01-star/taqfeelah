import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors/app-error";
import {
  ownerRequest,
  readJsonBody,
  routeStoreContext,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_STORE_ID,
} from "./helpers";

const assertStoreAccess = vi.fn();

vi.mock("@/core/auth/assert-store-access", () => ({
  assertStoreAccess,
}));

const tinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("inline attachment route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    assertStoreAccess.mockReset();
    assertStoreAccess.mockResolvedValue(undefined);
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("POST registers inline attachment", async () => {
    const { POST } = await import("../stores/[storeId]/attachments/inline/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/attachments/inline`, {
        method: "POST",
        body: JSON.stringify({
          attachment: {
            kind: "image",
            name: "receipt.png",
            mimeType: "image/png",
            sizeBytes: 120,
            dataUrl: tinyPng,
          },
        }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(201);
    const body = await readJsonBody<{ storageKey: string; mimeType: string }>(response);
    expect(body.storageKey.startsWith("inline:v1:")).toBe(true);
    expect(body.mimeType).toBe("image/png");
    expect(assertStoreAccess).toHaveBeenCalledWith(expect.objectContaining({
      storeId: TEST_STORE_ID,
      actorRole: "owner",
      minimumRole: "employee",
    }));
  });

  it("POST rejects invalid inline attachment payload", async () => {
    const { POST } = await import("../stores/[storeId]/attachments/inline/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/attachments/inline`, {
        method: "POST",
        body: JSON.stringify({
          attachment: {
            kind: "image",
            mimeType: "application/pdf",
            sizeBytes: 120,
            dataUrl: tinyPng,
          },
        }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST surfaces store access failures", async () => {
    assertStoreAccess.mockRejectedValueOnce(new ValidationError("Store access denied."));

    const { POST } = await import("../stores/[storeId]/attachments/inline/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/attachments/inline`, {
        method: "POST",
        body: JSON.stringify({
          kind: "image",
          mimeType: "image/png",
          sizeBytes: 120,
          dataUrl: tinyPng,
        }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(400);
    expect(assertStoreAccess).toHaveBeenCalledOnce();
  });
});
