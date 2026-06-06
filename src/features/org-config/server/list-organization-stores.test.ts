import { describe, expect, it, vi } from "vitest";

vi.mock("@/core/auth/assert-organization-access", () => ({
  assertOrganizationAccess: vi.fn(async () => ({
    memberId: "member-1",
    memberRole: "owner",
  })),
}));

const storeRows = [
  {
    id: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
    name: "Shami",
    location: "Riyadh",
    status: "active",
    createdAt: new Date("2026-06-01T08:00:00Z"),
    updatedAt: new Date("2026-06-01T08:00:00Z"),
  },
];

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: async () => storeRows,
        }),
      }),
    }),
  }),
}));

describe("listOrganizationStores", () => {
  it("returns active stores for organization owner", async () => {
    const { listOrganizationStores } = await import("./list-organization-stores");
    const result = await listOrganizationStores({
      organizationId: "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      actorUserId: "e8f3e35b-6051-4da3-8b10-979700c2f00f",
      actorRole: "owner",
      status: "active",
    });

    expect(result.stores).toHaveLength(1);
    expect(result.stores[0].name).toBe("Shami");
    expect(result.stores[0].location).toBe("Riyadh");
  });
});
