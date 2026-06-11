import { describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors/app-error";

vi.mock("@/core/auth/assert-platform-admin-access", () => ({
  assertPlatformAdminAccess: vi.fn(),
}));

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    transaction: vi.fn(),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => []),
        })),
      })),
    })),
  }),
}));

describe("createSaasAccount", () => {
  it("rejects invalid input before database access", async () => {
    const { createSaasAccount } = await import("@/features/saas-admin/server/create-saas-account");

    await expect(
      createSaasAccount({
        actorUserId: "not-a-uuid",
        organizationName: "",
        ownerName: "",
        ownerUsername: "",
        ownerPassword: "123",
        planCode: "starter",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("returns a clear message for short passwords", async () => {
    const { createSaasAccount } = await import("@/features/saas-admin/server/create-saas-account");

    await expect(
      createSaasAccount({
        actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
        organizationName: "Acme",
        ownerName: "Owner",
        ownerUsername: "acme",
        ownerPassword: "123",
        planCode: "starter",
      }),
    ).rejects.toMatchObject({
      message: "Password must be at least 4 characters.",
    });
  });
});
