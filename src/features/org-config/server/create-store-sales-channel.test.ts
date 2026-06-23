import { beforeEach, describe, expect, it, vi } from "vitest";

const assertStoreAccess = vi.fn();
const getDb = vi.fn();

vi.mock("@/core/auth/assert-store-access", () => ({
  assertStoreAccess,
}));

vi.mock("@/core/db/client", () => ({
  getDb,
}));

describe("createStoreSalesChannel", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("upserts existing channel by normalized name instead of creating duplicate", async () => {
    const selectLimit = vi.fn().mockResolvedValueOnce([
      {
        id: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
        name: "Cash",
        kind: "payment_method",
        status: "retired",
        retiredAt: new Date("2026-06-22T00:00:00.000Z"),
        createdAt: new Date("2026-06-20T00:00:00.000Z"),
      },
    ]);

    const updateReturning = vi.fn().mockResolvedValueOnce([
      {
        id: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
        name: "cash",
        kind: "payment_method",
        status: "active",
        retiredAt: null,
        createdAt: new Date("2026-06-20T00:00:00.000Z"),
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
            returning: updateReturning,
          })),
        })),
      })),
      insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) })),
    };

    getDb.mockReturnValue({
      transaction: async (callback: (trx: typeof tx) => Promise<unknown>) => callback(tx),
    });

    const { createStoreSalesChannel } = await import("./create-store-sales-channel");

    const result = await createStoreSalesChannel({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
      name: "  cash  ",
      kind: "payment_method",
      status: "active",
    });

    expect(result.id).toBe("9bc40d4f-c773-4ba3-87db-b8bb1467dafb");
    expect(result.status).toBe("active");
    expect(tx.update).toHaveBeenCalledOnce();
  });

  it("creates a new channel when no normalized-name match exists", async () => {
    const selectLimit = vi.fn().mockResolvedValueOnce([]);
    const salesInsertReturning = vi.fn().mockResolvedValueOnce([
      {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        name: "Delivery",
        kind: "sales_channel",
        status: "active",
        retiredAt: null,
        createdAt: new Date("2026-06-23T00:00:00.000Z"),
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
      update: vi.fn(),
      insert: vi
        .fn()
        .mockReturnValueOnce({
          values: vi.fn(() => ({ returning: salesInsertReturning })),
        })
        .mockReturnValueOnce({ values: vi.fn().mockResolvedValue(undefined) }),
    };

    getDb.mockReturnValue({
      transaction: async (callback: (trx: typeof tx) => Promise<unknown>) => callback(tx),
    });

    const { createStoreSalesChannel } = await import("./create-store-sales-channel");

    const result = await createStoreSalesChannel({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
      name: "Delivery",
      kind: "sales_channel",
      status: "active",
    });

    expect(result.id).toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    expect(tx.update).not.toHaveBeenCalled();
  });
});
