import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ownerRequest,
  readJsonBody,
  routeEntryContext,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_ENTRY_ID,
  TEST_STORE_ID,
} from "./helpers";

const voidStoreEntry = vi.fn();
const restoreStoreEntry = vi.fn();

vi.mock("@/features/entries/server/void-store-entry", () => ({
  voidStoreEntry,
}));

vi.mock("@/features/entries/server/restore-store-entry", () => ({
  restoreStoreEntry,
}));

describe("entry mutation route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    voidStoreEntry.mockReset();
    restoreStoreEntry.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("POST void marks entry voided with optional reason", async () => {
    voidStoreEntry.mockResolvedValueOnce({
      id: TEST_ENTRY_ID,
      status: "voided",
    });

    const { POST } = await import("../stores/[storeId]/entries/[entryId]/void/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/entries/${TEST_ENTRY_ID}/void`, {
        method: "POST",
        body: JSON.stringify({ reason: "duplicate entry" }),
      }),
      routeEntryContext(),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ status: string }>(response);
    expect(body.status).toBe("voided");
    expect(voidStoreEntry).toHaveBeenCalledWith(expect.objectContaining({
      entryId: TEST_ENTRY_ID,
      reason: "duplicate entry",
      actorRole: "owner",
    }));
  });

  it("POST restore reactivates voided entry", async () => {
    restoreStoreEntry.mockResolvedValueOnce({
      id: TEST_ENTRY_ID,
      status: "active",
    });

    const { POST } = await import("../stores/[storeId]/entries/[entryId]/restore/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/entries/${TEST_ENTRY_ID}/restore`, {
        method: "POST",
        body: JSON.stringify({ reason: "owner correction" }),
      }),
      routeEntryContext(),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ status: string }>(response);
    expect(body.status).toBe("active");
    expect(restoreStoreEntry).toHaveBeenCalledWith(expect.objectContaining({
      entryId: TEST_ENTRY_ID,
      reason: "owner correction",
    }));
  });
});
