import { describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors/app-error";

describe("assertSaasMemberStoreIds", () => {
  it("returns unique store ids when all stores are active", async () => {
    const { assertSaasMemberStoreIds } = await import("@/features/saas-admin/server/assert-saas-member-store-ids");
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(async () => [
            { id: "store-1", status: "active" },
            { id: "store-2", status: "active" },
          ]),
        })),
      })),
    };

    await expect(
      assertSaasMemberStoreIds(db as never, "org-1", ["store-1", "store-2", "store-1"]),
    ).resolves.toEqual(["store-1", "store-2"]);
  });

  it("rejects archived stores", async () => {
    const { assertSaasMemberStoreIds } = await import("@/features/saas-admin/server/assert-saas-member-store-ids");
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(async () => [
            { id: "store-1", status: "archived" },
          ]),
        })),
      })),
    };

    await expect(
      assertSaasMemberStoreIds(db as never, "org-1", ["store-1"]),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
