import { describe, expect, it, vi } from "vitest";
import { loadCloseoutOwnerEditMetaByCloseoutId } from "./load-closeout-owner-edit-meta";

describe("loadCloseoutOwnerEditMetaByCloseoutId", () => {
  it("returns empty maps when no closeout ids are provided", async () => {
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            orderBy: async () => [],
          }),
        }),
      }),
    };

    const result = await loadCloseoutOwnerEditMetaByCloseoutId(db as never, {
      organizationId: "11111111-1111-4111-8111-111111111111",
      storeId: "22222222-2222-4222-8222-222222222222",
      closeoutRowIds: [],
      clientCloseoutIds: [],
    });

    expect(result.byDailyCloseoutId.size).toBe(0);
    expect(result.byClientCloseoutId.size).toBe(0);
  });

  it("filters audit rows in SQL by requested closeout ids", async () => {
    const orderBy = vi.fn(async () => [{
      actorUserId: "33333333-3333-4333-8333-333333333333",
      createdAt: new Date("2026-06-05T10:00:00.000Z"),
      metadata: { dailyCloseoutId: "44444444-4444-4444-8444-444444444444" },
    }]);
    const where = vi.fn(() => ({ orderBy }));
    const from = vi.fn(() => ({ where }));
    const select = vi.fn(() => ({ from }));

    const usersWhere = vi.fn(async () => [{ id: "33333333-3333-4333-8333-333333333333", name: "Owner" }]);
    const usersFrom = vi.fn(() => ({ where: usersWhere }));
    const usersSelect = vi.fn(() => ({ from: usersFrom }));

    const db = {
      select: vi.fn((fields) => {
        if ("actorUserId" in fields) {
          return select();
        }
        return usersSelect();
      }),
    };

    const result = await loadCloseoutOwnerEditMetaByCloseoutId(db as never, {
      organizationId: "11111111-1111-4111-8111-111111111111",
      storeId: "22222222-2222-4222-8222-222222222222",
      closeoutRowIds: ["44444444-4444-4444-8444-444444444444"],
      clientCloseoutIds: [],
    });

    expect(where).toHaveBeenCalledOnce();
    expect(result.byDailyCloseoutId.get("44444444-4444-4444-8444-444444444444")).toMatchObject({
      ownerEditedByUserId: "33333333-3333-4333-8333-333333333333",
      ownerEditedByName: "Owner",
    });
  });
});
