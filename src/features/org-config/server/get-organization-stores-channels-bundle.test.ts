import { beforeEach, describe, expect, it, vi } from "vitest";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const STORE_A = "22222222-2222-4222-8222-222222222222";
const STORE_B = "33333333-3333-4333-8333-333333333333";
const ACTOR_ID = "44444444-4444-4444-8444-444444444444";

vi.mock("@/core/auth/assert-organization-access", () => ({
  assertOrganizationAccess: vi.fn(async () => ({
    memberId: "member-1",
    memberRole: "owner",
  })),
}));

describe("getOrganizationStoresChannelsBundle", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns stores and channels grouped by store in one round trip", async () => {
    const storeSelect = vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(async () => [
            {
              id: STORE_A,
              name: "Store A",
              location: "",
              status: "active",
              operationalSettings: {},
              createdAt: new Date("2026-06-01T00:00:00.000Z"),
              updatedAt: new Date("2026-06-01T00:00:00.000Z"),
            },
            {
              id: STORE_B,
              name: "Store B",
              location: "",
              status: "active",
              operationalSettings: {},
              createdAt: new Date("2026-06-01T00:00:00.000Z"),
              updatedAt: new Date("2026-06-01T00:00:00.000Z"),
            },
          ]),
        })),
      })),
    }));

    const channelSelect = vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(async () => [
            {
              id: "55555555-5555-4555-8555-555555555555",
              storeId: STORE_A,
              name: "Cash",
              status: "active",
              retiredAt: null,
              createdAt: new Date("2026-06-01T00:00:00.000Z"),
            },
          ]),
        })),
      })),
    }));

    vi.doMock("@/core/db/client", () => ({
      getDb: () => ({
        select: (fields: Record<string, unknown>) => (
          "storeId" in fields ? channelSelect() : storeSelect()
        ),
      }),
    }));

    const { getOrganizationStoresChannelsBundle: loadBundle } = await import("./get-organization-stores-channels-bundle");
    const result = await loadBundle({
      organizationId: ORG_ID,
      actorUserId: ACTOR_ID,
      actorRole: "owner",
    });

    expect(result.stores).toHaveLength(2);
    expect(result.channelsByStoreId[STORE_A]).toHaveLength(1);
    expect(result.channelsByStoreId[STORE_B]).toEqual([]);
  });
});
