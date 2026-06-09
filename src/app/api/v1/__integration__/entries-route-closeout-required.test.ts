import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ownerRequest,
  readJsonBody,
  routeStoreContext,
  setupRouteIntegrationEnv,
  teardownRouteIntegrationEnv,
  TEST_STORE_ID,
} from "./helpers";

const selectChain = {
  from: vi.fn(() => ({
    where: vi.fn(() => ({
      limit: vi.fn(async () => [{ id: "11111111-1111-4111-8111-111111111111" }]),
    })),
  })),
};

const db = {
  select: vi.fn(() => selectChain),
};

vi.mock("@/core/config/entries-api-mode", () => ({
  isEntriesApiDbSourceMode: vi.fn(() => true),
}));

vi.mock("@/core/auth/assert-store-access", () => ({
  assertStoreAccess: vi.fn(async () => undefined),
}));

vi.mock("@/core/db/client", () => ({
  getDb: () => db,
}));

vi.mock("@/features/usage/server/fire-usage-event-safe", () => ({
  fireUsageEventSafe: vi.fn(),
}));

vi.mock("@/features/org-config/server/resolve-store-sales-channels-for-write", () => ({
  resolveStoreSalesChannelsForWrite: vi.fn(async (_db, _org, _store, rows: unknown[]) => rows),
}));

describe("entries route closeout enforcement", () => {
  beforeEach(() => {
    setupRouteIntegrationEnv();
    process.env.NEXT_PUBLIC_ENTRIES_API_ENABLED = "true";
    vi.clearAllMocks();
  });

  afterEach(() => {
    teardownRouteIntegrationEnv();
    delete process.env.NEXT_PUBLIC_ENTRIES_API_ENABLED;
  });

  it("POST without closeoutId returns 400 through real createStoreEntry", async () => {
    const { POST } = await import("../stores/[storeId]/entries/route");
    const response = await POST(
      ownerRequest(`http://localhost/api/v1/stores/${TEST_STORE_ID}/entries`, {
        method: "POST",
        body: JSON.stringify({
          date: "2026-06-05",
          type: "expense",
          amountHalalas: 5000,
        }),
      }),
      routeStoreContext(),
    );

    expect(response.status).toBe(400);
    const body = await readJsonBody<{ error: { code: string; message: string } }>(response);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe("Financial entries require a linked closeout.");
  });
});
