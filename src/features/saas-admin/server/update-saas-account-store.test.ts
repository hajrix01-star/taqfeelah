import { describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors/app-error";

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => [{ id: "org-1" }]),
        })),
      })),
    })),
    transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback({
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(async () => []),
          })),
        })),
      })),
    })),
  }),
}));

describe("updateSaasAccountStore", () => {
  it("rejects empty update payloads", async () => {
    const { updateSaasAccountStore } = await import("@/features/saas-admin/server/update-saas-account-store");

    await expect(
      updateSaasAccountStore({
        actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
        organizationId: "e8f3e35b-6051-4da3-8b10-979700c2f001",
        storeId: "e8f3e35b-6051-4da3-8b10-979700c2f002",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("returns store not found when store is missing", async () => {
    const { updateSaasAccountStore } = await import("@/features/saas-admin/server/update-saas-account-store");

    await expect(
      updateSaasAccountStore({
        actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
        organizationId: "e8f3e35b-6051-4da3-8b10-979700c2f001",
        storeId: "e8f3e35b-6051-4da3-8b10-979700c2f002",
        name: "Updated",
      }),
    ).rejects.toMatchObject({
      code: "STORE_NOT_FOUND",
    });
  });
});
