import { describe, expect, it } from "vitest";
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
});
