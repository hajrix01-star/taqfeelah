import { beforeEach, describe, expect, it, vi } from "vitest";

const assertOrganizationAccess = vi.fn();
const getDb = vi.fn();

vi.mock("@/core/auth/assert-organization-access", () => ({
  assertOrganizationAccess,
}));

vi.mock("@/core/db/client", () => ({
  getDb,
}));

describe("deleteOrganizationStore", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("rejects deleting store with operational records", async () => {
    const selectLimit = vi
      .fn()
      .mockResolvedValueOnce([{ id: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c", name: "Shami" }])
      .mockResolvedValueOnce([{ closeoutsCount: 1 }])
      .mockResolvedValueOnce([{ entriesCount: 0 }]);

    const tx = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: selectLimit,
          })),
        })),
      })),
      delete: vi.fn(),
      insert: vi.fn(),
    };

    getDb.mockReturnValue({
      transaction: async (callback: (trx: typeof tx) => Promise<unknown>) => callback(tx),
    });

    const { deleteOrganizationStore } = await import("./delete-organization-store");

    await expect(deleteOrganizationStore({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
      reason: "owner_deleted_store",
    })).rejects.toThrow("Store has operational records and cannot be deleted.");
  });

  it("deletes store when no operational records exist", async () => {
    const selectLimit = vi
      .fn()
      .mockResolvedValueOnce([{ id: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c", name: "Shami" }])
      .mockResolvedValueOnce([{ closeoutsCount: 0 }])
      .mockResolvedValueOnce([{ entriesCount: 0 }]);

    const tx = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: selectLimit,
          })),
        })),
      })),
      delete: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
      insert: vi.fn(() => ({
        values: vi.fn().mockResolvedValue(undefined),
      })),
    };

    getDb.mockReturnValue({
      transaction: async (callback: (trx: typeof tx) => Promise<unknown>) => callback(tx),
    });

    const { deleteOrganizationStore } = await import("./delete-organization-store");

    const result = await deleteOrganizationStore({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
      reason: "owner_deleted_store",
    });

    expect(result).toMatchObject({
      id: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      deleted: true,
    });
    expect(tx.delete).toHaveBeenCalledOnce();
  });
});
