import { describe, expect, it } from "vitest";
import {
  buildInitialStoreChannelSettings,
  createDefaultStoreChannelConfig,
  getStoreChannelConfig,
  resolveStoreChannelConfig,
} from "./store-channel-config";

const defaultConfig = {
  channels: [{ id: "cash" }, { id: "mada" }],
  activeIds: ["cash", "mada"],
};

describe("store channel config", () => {
  it("returns per-store config or default template", () => {
    expect(getStoreChannelConfig({ shami: { channels: [{ id: "cash" }], activeIds: ["cash"] } }, "shami", defaultConfig))
      .toEqual({ channels: [{ id: "cash" }], activeIds: ["cash"] });
    expect(getStoreChannelConfig({}, "shami", defaultConfig)).toEqual(defaultConfig);
  });

  it("builds default and resolved channel config helpers", () => {
    const created = createDefaultStoreChannelConfig([{ id: "cash" }, { id: "mada" }]);
    expect(created.activeIds).toEqual(["cash", "mada"]);
    expect(resolveStoreChannelConfig({}, "shami", created)).toEqual(created);
  });

  it("builds initial settings from legacy configured channels", () => {
    const initial = buildInitialStoreChannelSettings({
      configuredChannels: [{ id: "cash", retired: false }],
      activeChannels: ["cash"],
    }, [{ id: "shami" }], defaultConfig) as Record<string, { channels: Array<{ id: string; retired?: boolean }>; activeIds: string[] }>;

    expect(initial.shami).toEqual({
      channels: [{ id: "cash", retired: false }],
      activeIds: ["cash"],
    });
  });
});
