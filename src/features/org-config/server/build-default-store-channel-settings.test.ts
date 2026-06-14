import { describe, expect, it } from "vitest";
import { buildDefaultStoreChannelSettings } from "./build-default-store-channel-settings";

describe("buildDefaultStoreChannelSettings", () => {
  it("provisions cash and bank as active default channels", () => {
    expect(buildDefaultStoreChannelSettings("store-1")).toEqual({
      "store-1": {
        channels: [
          { id: "cash", text: "cash", retired: false },
          { id: "bank", text: "bank", retired: false },
        ],
        activeIds: ["cash", "bank"],
      },
    });
  });
});
