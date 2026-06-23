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

const listStoreEntries = vi.fn();
const createStoreEntry = vi.fn();

vi.mock("@/features/entries/server/list-store-entries", () => ({
  listStoreEntries,
}));

vi.mock("@/features/entries/server/create-store-entry", () => ({
  createStoreEntry,
}));

describe("entries route integration", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    listStoreEntries.mockReset();
    createStoreEntry.mockReset();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
  });

  it("GET rejects invalid status query param", async () => {
    const { GET } = await import("../stores/[storeId]/entries/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/entries?status=invalid`),
      routeStoreContext(),
    );

    expect(response.status).toBe(400);
    expect(listStoreEntries).not.toHaveBeenCalled();
  });

  it("GET returns paginated payload by default", async () => {
    listStoreEntries.mockResolvedValueOnce({
      items: [{ id: "entry-1", type: "summary", status: "active" }],
      nextCursor: null,
    });

    const { GET } = await import("../stores/[storeId]/entries/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/entries?status=active`),
      routeStoreContext(),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ items: Array<{ id: string }>; nextCursor: string | null }>(response);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].id).toBe("entry-1");
    expect(body.nextCursor).toBeNull();
    expect(listStoreEntries).toHaveBeenCalledWith(expect.objectContaining({
      status: "active",
      limit: 50,
    }));
  });

  it("GET returns paginated payload when paginated=1", async () => {
    listStoreEntries.mockResolvedValueOnce({
      items: [{ id: "entry-2", type: "expense", status: "active" }],
      nextCursor: "cursor-1",
    });

    const { GET } = await import("../stores/[storeId]/entries/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/entries?status=active&paginated=1&limit=25`),
      routeStoreContext(),
    );

    expect(response.status).toBe(200);
    const body = await readJsonBody<{ items: Array<{ id: string }>; nextCursor: string }>(response);
    expect(body.items).toHaveLength(1);
    expect(body.nextCursor).toBe("cursor-1");
    expect(listStoreEntries).toHaveBeenCalledWith(expect.objectContaining({
      limit: 25,
    }));
  });

  it("GET uses max limit=100 policy by rejecting larger limits", async () => {
    listStoreEntries.mockRejectedValueOnce(
      new ValidationError("Invalid entries list input."),
    );

    const { GET } = await import("../stores/[storeId]/entries/route");
    const response = await GET(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/entries?status=active&limit=500`),
      routeStoreContext(),
    );

    expect(response.status).toBe(400);
    expect(listStoreEntries).toHaveBeenCalledWith(expect.objectContaining({
      limit: 500,
    }));
  });

  it("POST creates store entry when closeoutId is provided", async () => {
    createStoreEntry.mockResolvedValueOnce({
      id: "entry-3",
      type: "expense",
      status: "active",
    });

    const { POST } = await import("../stores/[storeId]/entries/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/entries`, {
        method: "POST",
        body: JSON.stringify({
          date: "2026-06-05",
          type: "expense",
          amountHalalas: 2500,
          categoryId: "rent",
          closeoutId: "11111111-1111-4111-8111-111111111111",
        }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(201);
    expect(createStoreEntry).toHaveBeenCalledWith(expect.objectContaining({
      date: "2026-06-05",
      type: "expense",
      amountHalalas: 2500,
      closeoutId: "11111111-1111-4111-8111-111111111111",
      actorRole: "owner",
    }));
  });
});
