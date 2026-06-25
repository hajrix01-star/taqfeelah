import { beforeEach, describe, expect, it, vi } from "vitest";

describe("extractCloseoutSalesChannels", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("falls back to a non-empty channel name when labels are blank", async () => {
    const { extractCloseoutSalesChannels } = await import("./resolve-closeout-sales-channels");
    const { setRuntimeApiIdMaps } = await import("./closeouts-api-client");
    setRuntimeApiIdMaps({
      storeIdMap: {},
      userIdMap: {},
      salesChannelIdMap: {
        cash: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
      },
    });

    const rows = extractCloseoutSalesChannels({
      sales: [{ channelId: "cash", name: "   ", amount: 100 }],
    });

    expect(rows).toEqual([{
      salesChannelId: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
      channelName: "cash",
      amountHalalas: 10000,
      legacyChannelId: "cash",
    }]);
  });

  it("uses an explicit unknown-channel label when no label or legacy id is available", async () => {
    const { extractCloseoutSalesChannels } = await import("./resolve-closeout-sales-channels");
    const { setRuntimeApiIdMaps } = await import("./closeouts-api-client");
    setRuntimeApiIdMaps({
      storeIdMap: {},
      userIdMap: {},
      salesChannelIdMap: {
        "f47ac10b-58cc-4372-a567-0e02b2c3d479": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      },
    });

    const rows = extractCloseoutSalesChannels({
      sales: [{ channelId: "f47ac10b-58cc-4372-a567-0e02b2c3d479", amount: 50 }],
    });

    expect(rows[0]?.channelName).toBe("Unknown channel");
  });
});
