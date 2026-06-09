import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { getDb } from "@/core/db/client";

vi.mock("@/core/config/entries-api-mode", () => ({
  isEntriesApiDbSourceMode: vi.fn(() => true),
}));

const selectChain = {
  from: vi.fn(() => ({
    where: vi.fn(() => ({
      limit: vi.fn(async () => [{ id: "11111111-1111-4111-8111-111111111111" }]),
    })),
  })),
};

type CloseoutLookupDb = ReturnType<typeof getDb>;

const db = {
  select: vi.fn(() => selectChain),
} as unknown as CloseoutLookupDb;

describe("assertCloseoutLinkedEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires closeoutId in db source mode", async () => {
    const { assertCloseoutLinkedEntry, CLOSEOUT_REQUIRED_FOR_ENTRY_MESSAGE } = await import("./assert-closeout-linked-entry");

    await expect(assertCloseoutLinkedEntry(db, {
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
    })).rejects.toMatchObject({
      message: CLOSEOUT_REQUIRED_FOR_ENTRY_MESSAGE,
    });
  });

  it("returns closeout id when closeout exists for store", async () => {
    const { assertCloseoutLinkedEntry } = await import("./assert-closeout-linked-entry");

    const closeoutId = await assertCloseoutLinkedEntry(db, {
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      closeoutId: "11111111-1111-4111-8111-111111111111",
    });

    expect(closeoutId).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("allows missing closeoutId when db source mode is off", async () => {
    const { isEntriesApiDbSourceMode } = await import("@/core/config/entries-api-mode");
    vi.mocked(isEntriesApiDbSourceMode).mockReturnValueOnce(false);

    const { assertCloseoutLinkedEntry } = await import("./assert-closeout-linked-entry");
    const closeoutId = await assertCloseoutLinkedEntry(db, {
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
    });

    expect(closeoutId).toBeNull();
    expect(db.select).not.toHaveBeenCalled();
  });
});

describe("createStoreEntry closeout enforcement", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("rejects standalone entry creation without closeoutId in db source mode", async () => {
    vi.doMock("@/core/auth/assert-store-access", () => ({
      assertStoreAccess: vi.fn(async () => undefined),
    }));
    vi.doMock("@/core/db/client", () => ({
      getDb: () => db,
    }));
    vi.doMock("@/features/usage/server/fire-usage-event-safe", () => ({
      fireUsageEventSafe: vi.fn(),
    }));
    vi.doMock("@/features/org-config/server/resolve-store-sales-channels-for-write", () => ({
      resolveStoreSalesChannelsForWrite: vi.fn(async (_db, _org, _store, rows) => rows),
    }));

    const { createStoreEntry } = await import("./create-store-entry");

    await expect(createStoreEntry({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
      date: "2026-06-05",
      type: "expense",
      amountHalalas: 5000,
      salesChannels: [],
    })).rejects.toMatchObject({
      message: "Financial entries require a linked closeout.",
    });
  });
});
