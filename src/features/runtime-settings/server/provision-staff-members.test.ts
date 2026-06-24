import { beforeEach, describe, expect, it, vi } from "vitest";

const updateWhere = vi.fn(async () => undefined);
const updateSet = vi.fn(() => ({ where: updateWhere }));
const update = vi.fn(() => ({ set: updateSet }));
const insertValues = vi.fn(async () => undefined);
const insert = vi.fn(() => ({ values: insertValues }));
const selectLimit = vi.fn(async () => []);
const selectWhere = vi.fn(() => ({ limit: selectLimit }));
const selectFrom = vi.fn(() => ({ where: selectWhere }));
const select = vi.fn(() => ({ from: selectFrom }));
const deactivateEmployeePinIdentity = vi.fn(async () => undefined);
const upsertEmployeePinIdentity = vi.fn(async () => undefined);

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    select,
    insert,
    update,
  }),
}));

vi.mock("@/features/auth/server/auth-identities", () => ({
  deactivateEmployeePinIdentity,
  upsertEmployeePinIdentity,
}));

describe("provisionStaffMembers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectLimit.mockResolvedValue([]);
  });

  it("marks inactive staff inactive in DB instead of only hiding them in runtime settings", async () => {
    const { provisionStaffMembers } = await import("@/features/runtime-settings/server/provision-staff-members");
    const result = await provisionStaffMembers(
      "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      [{
        id: "staff-1",
        apiUserId: "4cf1450d-08d8-4ca1-b180-1c2642174a79",
        nameEn: "Ali",
        active: false,
      }],
      { storeIdMap: {}, userIdMap: {} },
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("staff-1");
    expect(update).toHaveBeenCalled();
    expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ status: "inactive" }));
    expect(deactivateEmployeePinIdentity).toHaveBeenCalledWith("4cf1450d-08d8-4ca1-b180-1c2642174a79");
    expect(insert).not.toHaveBeenCalled();
  });

  it("resolves custom store ids from merged store map", async () => {
    const { parseJsonMap } = await import("@/features/runtime-settings/server/provision-staff-members");
    const storeIdMap = {
      shami: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
      "custom-1780679701214": "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
    };
    const { buildRuntimeApiIdMaps } = await import("@/core/client/runtime-api-id-maps");
    const maps = buildRuntimeApiIdMaps({
      configuredBusinesses: [{ id: "custom-1780679701214" }],
      envStoreIdMap: { shami: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c" },
    });
    expect(maps.storeIdMap["custom-1780679701214"]).toBe("302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c");
    expect(parseJsonMap(JSON.stringify(storeIdMap))).toEqual(storeIdMap);
  });
});
