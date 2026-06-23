import { beforeEach, describe, expect, it, vi } from "vitest";

const assertStoreAccess = vi.fn();
const getDb = vi.fn();

vi.mock("@/core/auth/assert-store-access", () => ({
  assertStoreAccess,
}));

vi.mock("@/core/db/client", () => ({
  getDb,
}));

describe("updateStoreSalesChannel", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("rejects retiring the last active sales channel", async () => {
    const selectLimit = vi
      .fn()
      .mockResolvedValueOnce([
        { id: "a1b2c3d4-e5f6-4789-a012-3456789abcde", name: "Cash", status: "active" },
      ])
      .mockResolvedValueOnce([{ count: 0 }]);

    const tx = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: selectLimit,
          })),
        })),
      })),
      update: vi.fn(),
      insert: vi.fn(),
    };

    getDb.mockReturnValue({
      transaction: async (callback: (trx: typeof tx) => Promise<unknown>) => callback(tx),
    });

    const { updateStoreSalesChannel } = await import("./update-store-sales-channel");

    await expect(updateStoreSalesChannel({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
      salesChannelId: "a1b2c3d4-e5f6-4789-a012-3456789abcde",
      status: "retired",
      reason: "owner_retired_channel",
    })).rejects.toThrow("At least one active sales channel is required per store.");

    expect(assertStoreAccess).toHaveBeenCalledOnce();
    expect(tx.update).not.toHaveBeenCalled();
  });

  it("allows retiring when another active sales channel exists", async () => {
    const selectLimit = vi
      .fn()
      .mockResolvedValueOnce([
        { id: "a1b2c3d4-e5f6-4789-a012-3456789abcde", name: "Cash", status: "active" },
      ])
      .mockResolvedValueOnce([{ count: 1 }]);

    const returningUpdate = vi.fn().mockResolvedValueOnce([
      {
        id: "a1b2c3d4-e5f6-4789-a012-3456789abcde",
        name: "Cash",
        status: "retired",
        retiredAt: new Date("2026-06-23T00:00:00.000Z"),
        createdAt: new Date("2026-06-22T00:00:00.000Z"),
      },
    ]);

    const tx = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: selectLimit,
          })),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: returningUpdate,
          })),
        })),
      })),
      insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) })),
    };

    getDb.mockReturnValue({
      transaction: async (callback: (trx: typeof tx) => Promise<unknown>) => callback(tx),
    });

    const { updateStoreSalesChannel } = await import("./update-store-sales-channel");

    const result = await updateStoreSalesChannel({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
      salesChannelId: "a1b2c3d4-e5f6-4789-a012-3456789abcde",
      status: "retired",
      reason: "owner_retired_channel",
    });

    expect(result.status).toBe("retired");
    expect(tx.update).toHaveBeenCalledOnce();
  });
});
