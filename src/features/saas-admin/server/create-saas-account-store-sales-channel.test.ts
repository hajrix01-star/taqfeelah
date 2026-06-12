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
    transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
      let selectCount = 0;
      return callback({
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn(async () => {
                selectCount += 1;
                if (selectCount === 1) return [{ id: "org-1" }];
                return [];
              }),
            })),
          })),
        })),
      });
    }),
  }),
}));

describe("createSaasAccountStoreSalesChannel", () => {
  it("rejects invalid create payloads", async () => {
    const { createSaasAccountStoreSalesChannel } = await import("@/features/saas-admin/server/create-saas-account-store-sales-channel");

    await expect(
      createSaasAccountStoreSalesChannel({
        actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
        organizationId: "e8f3e35b-6051-4da3-8b10-979700c2f001",
        storeId: "e8f3e35b-6051-4da3-8b10-979700c2f002",
        name: "",
        status: "active",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("returns store not found when store is missing", async () => {
    const { createSaasAccountStoreSalesChannel } = await import("@/features/saas-admin/server/create-saas-account-store-sales-channel");

    await expect(
      createSaasAccountStoreSalesChannel({
        actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
        organizationId: "e8f3e35b-6051-4da3-8b10-979700c2f001",
        storeId: "e8f3e35b-6051-4da3-8b10-979700c2f002",
        name: "Delivery",
        status: "active",
      }),
    ).rejects.toMatchObject({
      code: "STORE_NOT_FOUND",
    });
  });
});
