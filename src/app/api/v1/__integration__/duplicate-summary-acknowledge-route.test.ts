import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors/app-error";
import {
  ownerRequest,
  readJsonBody,
  routeStoreContext,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_ENTRY_ID,
  TEST_STORE_ID,
} from "./helpers";

const acknowledgeDuplicateSummaries = vi.fn();

vi.mock("@/features/entries/server/acknowledge-duplicate-summaries", () => ({
  acknowledgeDuplicateSummaries,
}));

describe("duplicate summary acknowledge route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    acknowledgeDuplicateSummaries.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("POST requires non-empty entryIds array", async () => {
    const { POST } = await import("../stores/[storeId]/entries/duplicate-summary/acknowledge/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/entries/duplicate-summary/acknowledge`, {
        method: "POST",
        body: JSON.stringify({ date: "2026-06-05", entryIds: [] }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(acknowledgeDuplicateSummaries).not.toHaveBeenCalled();
  });

  it("POST acknowledges duplicate summary entries", async () => {
    acknowledgeDuplicateSummaries.mockResolvedValueOnce({
      acknowledgedEntryIds: [TEST_ENTRY_ID],
      date: "2026-06-05",
    });

    const { POST } = await import("../stores/[storeId]/entries/duplicate-summary/acknowledge/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/entries/duplicate-summary/acknowledge`, {
        method: "POST",
        body: JSON.stringify({
          date: "2026-06-05",
          entryIds: [TEST_ENTRY_ID],
        }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(200);
    expect(acknowledgeDuplicateSummaries).toHaveBeenCalledWith(expect.objectContaining({
      storeId: TEST_STORE_ID,
      date: "2026-06-05",
      entryIds: [TEST_ENTRY_ID],
      actorRole: "owner",
    }));
  });

  it("POST surfaces server validation errors", async () => {
    acknowledgeDuplicateSummaries.mockRejectedValueOnce(new ValidationError("Invalid duplicate summary acknowledge input."));

    const { POST } = await import("../stores/[storeId]/entries/duplicate-summary/acknowledge/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/entries/duplicate-summary/acknowledge`, {
        method: "POST",
        body: JSON.stringify({
          date: "2026-06-05",
          entryIds: [TEST_ENTRY_ID],
        }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(400);
    expect(acknowledgeDuplicateSummaries).toHaveBeenCalledOnce();
  });
});
