import { describe, expect, it, vi } from "vitest";

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => []),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(async () => undefined),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(async () => undefined),
      })),
    })),
  }),
}));

describe("provisionStaffMembers", () => {
  it("returns inactive staff without provisioning", async () => {
    const { provisionStaffMembers } = await import("@/features/runtime-settings/server/provision-staff-members");
    const result = await provisionStaffMembers(
      "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      [{ id: "staff-1", nameEn: "Ali", active: false }],
      { storeIdMap: {}, userIdMap: {} },
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("staff-1");
  });
});
