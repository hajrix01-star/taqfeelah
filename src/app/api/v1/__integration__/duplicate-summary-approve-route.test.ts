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

const approveDuplicateSummary = vi.fn();

vi.mock("@/features/entries/server/approve-duplicate-summary", () => ({
  approveDuplicateSummary,
}));

describe("duplicate summary approve route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    approveDuplicateSummary.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("POST approves duplicate summary entry", async () => {
    approveDuplicateSummary.mockResolvedValueOnce({
      entryId: "entry-1",
      date: "2026-06-05",
      status: "active",
    });

    const { POST } = await import("../stores/[storeId]/entries/duplicate-summary/approve/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/entries/duplicate-summary/approve`, {
        method: "POST",
        body: JSON.stringify({
          date: "2026-06-05",
          payload: { type: "summary", amountHalalas: 120000 },
        }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(201);
    const body = await readJsonBody<{ entryId: string }>(response);
    expect(body.entryId).toBe("entry-1");
    expect(approveDuplicateSummary).toHaveBeenCalledWith(expect.objectContaining({
      storeId: TEST_STORE_ID,
      date: "2026-06-05",
      actorRole: "owner",
      payload: { type: "summary", amountHalalas: 120000 },
    }));
  });

  it("POST defaults payload type to summary when missing", async () => {
    approveDuplicateSummary.mockResolvedValueOnce({ entryId: "entry-2" });

    const { POST } = await import("../stores/[storeId]/entries/duplicate-summary/approve/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/entries/duplicate-summary/approve`, {
        method: "POST",
        body: JSON.stringify({ date: "2026-06-05" }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(201);
    expect(approveDuplicateSummary).toHaveBeenCalledWith(expect.objectContaining({
      payload: { type: "summary" },
    }));
  });

  it("POST surfaces server validation errors", async () => {
    approveDuplicateSummary.mockRejectedValueOnce(new ValidationError("Invalid duplicate summary approve input."));

    const { POST } = await import("../stores/[storeId]/entries/duplicate-summary/approve/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/entries/duplicate-summary/approve`, {
        method: "POST",
        body: JSON.stringify({ date: "invalid-date" }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(approveDuplicateSummary).toHaveBeenCalledOnce();
  });
});
