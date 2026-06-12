import { describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors/app-error";

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => []),
        })),
      })),
    })),
    transaction: vi.fn(),
  }),
}));

vi.mock("@/features/billing/server/assert-organization-entitlement", () => ({
  assertOrganizationEntitlement: vi.fn(async () => undefined),
}));

describe("createSaasAccountStore", () => {
  it("rejects invalid input before database access", async () => {
    const { createSaasAccountStore } = await import("@/features/saas-admin/server/create-saas-account-store");

    await expect(
      createSaasAccountStore({
        actorUserId: "not-a-uuid",
        organizationId: "not-a-uuid",
        name: "",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("returns organization not found when organization is missing", async () => {
    const { createSaasAccountStore } = await import("@/features/saas-admin/server/create-saas-account-store");

    await expect(
      createSaasAccountStore({
        actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
        organizationId: "e8f3e35b-6051-4da3-8b10-979700c2f001",
        name: "Branch 2",
      }),
    ).rejects.toMatchObject({
      code: "ORGANIZATION_NOT_FOUND",
    });
  });
});
