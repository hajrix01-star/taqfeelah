import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors/app-error";
import {
  ownerRequest,
  readJsonBody,
  routeCloseoutContext,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_CLOSEOUT_ID,
  TEST_STORE_ID,
} from "./helpers";

const reviewStoreCloseout = vi.fn();

vi.mock("@/features/closeouts/server/review-store-closeout", () => ({
  reviewStoreCloseout,
}));

describe("closeout review route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    reviewStoreCloseout.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("POST approves closeout review", async () => {
    reviewStoreCloseout.mockResolvedValueOnce({
      closeoutId: TEST_CLOSEOUT_ID,
      date: "2026-06-05",
      action: "approve",
      status: "active",
    });

    const { POST } = await import("../stores/[storeId]/closeouts/[closeoutId]/review/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/closeouts/${TEST_CLOSEOUT_ID}/review`, {
        method: "POST",
        body: JSON.stringify({ date: "2026-06-05", action: "approve" }),
      }),
      routeCloseoutContext(),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ action: string }>(response);
    expect(body.action).toBe("approve");
    expect(reviewStoreCloseout).toHaveBeenCalledWith(expect.objectContaining({
      storeId: TEST_STORE_ID,
      closeoutId: TEST_CLOSEOUT_ID,
      date: "2026-06-05",
      action: "approve",
      actorRole: "owner",
    }));
  });

  it("POST returns closeout for review", async () => {
    reviewStoreCloseout.mockResolvedValueOnce({
      closeoutId: TEST_CLOSEOUT_ID,
      date: "2026-06-05",
      action: "return",
      status: "returned",
    });

    const { POST } = await import("../stores/[storeId]/closeouts/[closeoutId]/review/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/closeouts/${TEST_CLOSEOUT_ID}/review`, {
        method: "POST",
        body: JSON.stringify({
          date: "2026-06-05",
          action: "return",
          reason: "missing attachment",
        }),
      }),
      routeCloseoutContext(),
    );

    expect(response.status).toBe(200);
    expect(reviewStoreCloseout).toHaveBeenCalledWith(expect.objectContaining({
      action: "return",
      reason: "missing attachment",
    }));
  });

  it("POST requires date in body", async () => {
    const { POST } = await import("../stores/[storeId]/closeouts/[closeoutId]/review/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/closeouts/${TEST_CLOSEOUT_ID}/review`, {
        method: "POST",
        body: JSON.stringify({ action: "approve" }),
      }),
      routeCloseoutContext(),
    );

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(reviewStoreCloseout).not.toHaveBeenCalled();
  });

  it("POST requires approve or return action", async () => {
    const { POST } = await import("../stores/[storeId]/closeouts/[closeoutId]/review/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/closeouts/${TEST_CLOSEOUT_ID}/review`, {
        method: "POST",
        body: JSON.stringify({ date: "2026-06-05", action: "reject" }),
      }),
      routeCloseoutContext(),
    );

    expect(response.status).toBe(400);
    expect(reviewStoreCloseout).not.toHaveBeenCalled();
  });

  it("POST surfaces server validation errors", async () => {
    reviewStoreCloseout.mockRejectedValueOnce(new ValidationError("Invalid closeout review input."));

    const { POST } = await import("../stores/[storeId]/closeouts/[closeoutId]/review/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/closeouts/${TEST_CLOSEOUT_ID}/review`, {
        method: "POST",
        body: JSON.stringify({ date: "2026-06-05", action: "approve" }),
      }),
      routeCloseoutContext(),
    );

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(reviewStoreCloseout).toHaveBeenCalledOnce();
  });
});
