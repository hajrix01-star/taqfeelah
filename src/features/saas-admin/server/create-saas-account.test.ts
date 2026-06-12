import { describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors/app-error";

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

vi.mock("@/features/billing/server/plan-catalog-repository", () => ({
  getPlanCatalogRow: vi.fn(async () => ({
    planCode: "starter",
    trialDays: 14,
  })),
}));

vi.mock("@/features/account-setup/server/create-account-setup-token", () => ({
  createAccountSetupToken: vi.fn(async () => ({
    setupUrl: "https://example.com/auth/setup?token=abc",
    expiresAt: "2026-12-31T00:00:00.000Z",
  })),
}));

describe("createSaasAccount", () => {
  it("rejects invalid input before database access", async () => {
    const { createSaasAccount } = await import("@/features/saas-admin/server/create-saas-account");

    await expect(
      createSaasAccount({
        actorUserId: "not-a-uuid",
        organizationName: "",
        ownerName: "",
        ownerPhone: "",
        planCode: "starter",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("requires a valid owner phone", async () => {
    const { createSaasAccount } = await import("@/features/saas-admin/server/create-saas-account");

    await expect(
      createSaasAccount({
        actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
        organizationName: "Acme",
        ownerName: "Owner",
        ownerPhone: "invalid",
        planCode: "starter",
      }),
    ).rejects.toMatchObject({
      message: "Invalid owner phone number.",
    });
  });
});
