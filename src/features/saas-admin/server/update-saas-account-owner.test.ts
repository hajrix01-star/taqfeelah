import { beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors/app-error";

const resolveOrganizationOwnerMember = vi.fn();

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    transaction: vi.fn(),
    select: vi.fn(),
  }),
}));

vi.mock("@/features/saas-admin/server/resolve-organization-owner-member", () => ({
  resolveOrganizationOwnerMember,
}));

vi.mock("@/features/runtime-settings/server/sync-runtime-owner-profile", () => ({
  syncRuntimeOwnerProfileForOrganization: vi.fn(),
}));

vi.mock("@/features/auth/server/auth-identities", () => ({
  upsertOwnerPasswordIdentity: vi.fn(),
}));

describe("updateSaasAccountOwner", () => {
  beforeEach(() => {
    resolveOrganizationOwnerMember.mockReset();
  });

  it("rejects invalid owner phone", async () => {
    resolveOrganizationOwnerMember.mockResolvedValueOnce({
      memberId: "member-1",
      userId: "user-1",
      name: "Owner",
      memberStatus: "active",
      username: "owner",
      loginPhone: "+966512345678",
    });

    const { updateSaasAccountOwner } = await import("./update-saas-account-owner");

    await expect(
      updateSaasAccountOwner({
        actorUserId: "00000000-0000-4000-8000-000000000001",
        organizationId: "00000000-0000-4000-8000-000000000002",
        ownerPhone: "invalid",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("requires owner member for non-phone owner updates", async () => {
    resolveOrganizationOwnerMember.mockResolvedValueOnce(null);

    const { updateSaasAccountOwner } = await import("./update-saas-account-owner");

    await expect(
      updateSaasAccountOwner({
        actorUserId: "00000000-0000-4000-8000-000000000001",
        organizationId: "00000000-0000-4000-8000-000000000002",
        ownerName: "Owner",
      }),
    ).rejects.toThrow("Owner member was not found for this organization.");
  });
});
