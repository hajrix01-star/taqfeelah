import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveStoreSalesChannelsForWrite } from "./resolve-store-sales-channels-for-write";

describe("resolveStoreSalesChannelsForWrite", () => {
  const organizationId = "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1";
  const storeId = "302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c";
  const dbChannelId = "9bc40d4f-c773-4ba3-87db-b8bb1467dafb";

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps canonical channel ids that exist for the store", async () => {
    const db = {
      select: () => ({
        from: () => ({
          where: async () => [{ id: dbChannelId, name: "Cash" }],
        }),
      }),
    };

    const resolved = await resolveStoreSalesChannelsForWrite(
      db as never,
      organizationId,
      storeId,
      [{ salesChannelId: dbChannelId, channelName: "Cash", amountHalalas: 10000 }],
    );

    expect(resolved).toEqual([
      { salesChannelId: dbChannelId, channelName: "Cash", amountHalalas: 10000 },
    ]);
  });

  it("resolves stale client ids by channel name snapshot", async () => {
    const db = {
      select: () => ({
        from: () => ({
          where: async () => [{ id: dbChannelId, name: "نقد" }],
        }),
      }),
    };

    const resolved = await resolveStoreSalesChannelsForWrite(
      db as never,
      organizationId,
      storeId,
      [{
        salesChannelId: "7c3a1f2e-8b4d-4e9a-a1c2-3d4e5f6a7b8c",
        channelName: "نقد",
        amountHalalas: 5000,
      }],
    );

    expect(resolved[0]?.salesChannelId).toBe(dbChannelId);
  });

  it("rejects name fallback in production", async () => {
    vi.stubEnv("APP_MODE", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "production");

    const db = {
      select: () => ({
        from: () => ({
          where: async () => [{ id: dbChannelId, name: "Cash" }],
        }),
      }),
    };

    await expect(resolveStoreSalesChannelsForWrite(
      db as never,
      organizationId,
      storeId,
      [{
        salesChannelId: "7c3a1f2e-8b4d-4e9a-a1c2-3d4e5f6a7b8c",
        channelName: "Cash",
        amountHalalas: 5000,
      }],
    )).rejects.toThrow("Sales channel id is required");
  });
});
