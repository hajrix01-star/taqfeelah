import { describe, expect, it } from "vitest";
import {
  addCustomSalesChannel,
  canRequestRetireSalesChannel,
  cloneStoreChannelDraft,
  restoreRetiredSalesChannel,
  retireSalesChannelInDraft,
  toggleSalesChannelActive,
} from "./owner-settings-channel-actions";

const baseConfig = {
  channels: [
    { id: "cash", retired: false },
    { id: "mada", retired: false },
  ],
  activeIds: ["cash", "mada"],
};

describe("owner settings channel actions", () => {
  it("clones channel draft without shared references", () => {
    const draft = cloneStoreChannelDraft(baseConfig);
    draft.activeIds.push("new");
    draft.channels[0].retired = true;

    expect(baseConfig.activeIds).toEqual(["cash", "mada"]);
    expect(baseConfig.channels[0].retired).toBe(false);
  });

  it("blocks disabling the last active channel", () => {
    const single = { channels: [{ id: "cash" }], activeIds: ["cash"] };
    expect(toggleSalesChannelActive(single, "cash").blocked).toBe(true);
    expect(canRequestRetireSalesChannel(single, { id: "cash" })).toBe(false);
  });

  it("toggles and restores channels", () => {
    const toggled = toggleSalesChannelActive(baseConfig, "mada");
    expect(toggled.blocked).toBe(false);
    expect(toggled.config.activeIds).toEqual(["cash"]);

    const retired = retireSalesChannelInDraft(baseConfig, { id: "mada" });
    expect(retired.activeIds).toEqual(["cash"]);
    expect(retired.channels.find((item) => item.id === "mada")?.retired).toBe(true);

    const restored = restoreRetiredSalesChannel(retired, { id: "mada" });
    expect(restored.activeIds).toEqual(["cash", "mada"]);
    expect(restored.channels.find((item) => item.id === "mada")?.retired).toBe(false);
  });

  it("adds custom sales channel when name is provided", () => {
    const result = addCustomSalesChannel(baseConfig, "  Delivery  ", { id: "channel-test" });
    expect(result.added).toBe(true);
    expect(result.config.channels).toHaveLength(3);
    expect(result.config.activeIds).toContain("channel-test");
  });
});
