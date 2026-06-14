import { beforeEach, describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors/app-error";

const provisionSalesChannels = vi.fn(async () => ({}));
const assertOrganizationAccess = vi.fn(async () => undefined);
const assertOrganizationEntitlement = vi.fn(async () => undefined);

const insertReturning = vi.fn(async () => ([{
  id: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
  name: "Branch",
  location: "Riyadh",
  status: "active",
  createdAt: new Date("2026-06-14T12:00:00.000Z"),
  updatedAt: new Date("2026-06-14T12:00:00.000Z"),
}]));
const insert = vi.fn(() => ({
  values: vi.fn(() => ({ returning: insertReturning })),
}));

vi.mock("@/features/runtime-settings/server/provision-sales-channels", () => ({
  provisionSalesChannels,
}));

vi.mock("@/core/auth/assert-organization-access", () => ({
  assertOrganizationAccess,
}));

vi.mock("@/features/billing/server/assert-organization-entitlement", () => ({
  assertOrganizationEntitlement,
}));

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback({
      insert,
    })),
  }),
}));

describe("createOrganizationStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid input before database access", async () => {
    const { createOrganizationStore } = await import("./create-organization-store");

    await expect(
      createOrganizationStore({
        organizationId: "not-a-uuid",
        actorUserId: "not-a-uuid",
        actorRole: "owner",
        name: "",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("provisions default cash and bank channels for new stores", async () => {
    const { createOrganizationStore } = await import("./create-organization-store");

    const created = await createOrganizationStore({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
      name: "Branch",
      location: "Riyadh",
    });

    expect(created.name).toBe("Branch");
    expect(provisionSalesChannels).toHaveBeenCalledWith(
      "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      {
        "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c": {
          channels: [
            { id: "cash", text: "cash", retired: false },
            { id: "bank", text: "bank", retired: false },
          ],
          activeIds: ["cash", "bank"],
        },
      },
      expect.objectContaining({
        storeIdMap: { "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c": "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c" },
        salesChannelIdMap: {},
      }),
    );
  });
});
