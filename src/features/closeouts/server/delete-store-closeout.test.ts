import { beforeEach, describe, expect, it, vi } from "vitest";
import { auditEvents, dailyCloseouts, entries } from "@/core/db/schema";

type UpdateCall = { table: unknown; values: unknown };

const updateCalls: UpdateCall[] = [];
let existingCloseout = true;

vi.mock("@/core/auth/assert-store-access", () => ({
  assertStoreAccess: vi.fn(async () => undefined),
}));

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => (
            existingCloseout
              ? [{
                id: "daily-closeout-1",
                date: "2026-06-05",
                clientCloseoutId: "client-closeout-1",
              }]
              : []
          ),
        }),
      }),
    }),
    transaction: async (callback: (tx: ReturnType<typeof createTx>) => Promise<unknown>) =>
      callback(createTx()),
  }),
}));

function createTx() {
  return {
    update: (table: unknown) => ({
      set: (values: unknown) => {
        updateCalls.push({ table, values });
        return {
          where: () => ({
            returning: async () => (
              table === entries ? [{ id: "entry-1" }, { id: "entry-2" }] : []
            ),
          }),
        };
      },
    }),
    insert: (table: unknown) => ({
      values: async (values: unknown) => {
        if (table === auditEvents) {
          expect((values as { action: string }).action).toBe("closeout_deleted");
        }
        return undefined;
      },
    }),
  };
}

describe("deleteStoreCloseout", () => {
  beforeEach(() => {
    updateCalls.length = 0;
    existingCloseout = true;
  });

  it("voids entries and closeout without deleting history for owner", async () => {
    const { deleteStoreCloseout } = await import("./delete-store-closeout");

    const result = await deleteStoreCloseout({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      clientCloseoutId: "client-closeout-1",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
    });

    expect(result.deleted).toBe(true);
    expect(updateCalls.some((call) => (
      call.table === entries
      && (call.values as { status?: string }).status === "voided"
    ))).toBe(true);
    expect(updateCalls.some((call) => (
      call.table === dailyCloseouts
      && (call.values as { status?: string }).status === "voided"
    ))).toBe(true);
  });

  it("forbids employee delete", async () => {
    const { deleteStoreCloseout } = await import("./delete-store-closeout");

    await expect(deleteStoreCloseout({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      clientCloseoutId: "client-closeout-1",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "employee",
    })).rejects.toThrow(/Only owner or manager can delete a closeout/);
  });

  it("throws when closeout is missing", async () => {
    existingCloseout = false;
    const { deleteStoreCloseout } = await import("./delete-store-closeout");

    await expect(deleteStoreCloseout({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      clientCloseoutId: "missing",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
    })).rejects.toThrow(/Closeout not found/);
  });
});
