import { beforeEach, describe, expect, it, vi } from "vitest";

const insertValues = vi.fn();
const insert = vi.fn(() => ({ values: insertValues }));
const updateSet = vi.fn(() => ({ where: vi.fn() }));
const update = vi.fn(() => ({ set: updateSet }));
const selectLimit = vi.fn(async () => []);
const selectWhere = vi.fn(() => ({ limit: selectLimit }));
const selectFrom = vi.fn(() => ({ where: selectWhere }));
const select = vi.fn(() => ({ from: selectFrom }));

vi.mock("@/core/db/client", () => ({
  getDb: () => ({
    select,
    insert,
    update,
  }),
}));

describe("provisionSalesChannels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectLimit.mockResolvedValue([]);
    insertValues.mockResolvedValue(undefined);
  });

  it("uses the provided executor instead of the global db client", async () => {
    const executor = {
      select,
      insert,
      update,
    } as never;
    const { provisionSalesChannels } = await import("./provision-sales-channels");

    await provisionSalesChannels(
      "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      {
        shami: {
          channels: [{ id: "cash", text: "cash" }],
          activeIds: ["cash"],
        },
      },
      {
        storeIdMap: { shami: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c" },
        salesChannelIdMap: {
          cash: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
        },
        executor,
      },
    );

    expect(select).toHaveBeenCalled();
    expect(insert).toHaveBeenCalled();
  });

  it("upserts known prototype channels for active store config", async () => {
    const { provisionSalesChannels } = await import("./provision-sales-channels");
    const result = await provisionSalesChannels(
      "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      {
        shami: {
          channels: [
            { id: "cash", text: "cash" },
            { id: "mada", text: "mada" },
          ],
          activeIds: ["cash", "mada"],
        },
      },
      {
        storeIdMap: { shami: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c" },
        salesChannelIdMap: {
          cash: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
          mada: "7c3a1f2e-8b4d-4e9a-a1c2-3d4e5f6a7b8c",
        },
      },
    );

    expect(insert).toHaveBeenCalled();
    expect(result.shami?.channels?.[0]?.apiChannelId).toBe("9bc40d4f-c773-4ba3-87db-b8bb1467dafb");
    expect(result.shami?.channels?.[1]?.apiChannelId).toBe("7c3a1f2e-8b4d-4e9a-a1c2-3d4e5f6a7b8c");
  });

  it("does not move an existing sales channel row from another store", async () => {
    selectLimit.mockResolvedValueOnce([
      {
        id: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
        storeId: "11111111-1111-4111-8111-111111111111",
      },
    ] as never);

    const { provisionSalesChannels } = await import("./provision-sales-channels");
    const result = await provisionSalesChannels(
      "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1",
      {
        shami: {
          channels: [{ id: "cash", text: "cash" }],
          activeIds: ["cash"],
        },
      },
      {
        storeIdMap: { shami: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c" },
        salesChannelIdMap: {
          cash: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
        },
      },
    );

    expect(update).not.toHaveBeenCalled();
    expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({
      storeId: "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c",
    }));
    expect(result.shami?.channels?.[0]?.apiChannelId).not.toBe("9bc40d4f-c773-4ba3-87db-b8bb1467dafb");
  });
});
