import { describe, expect, it } from "vitest";
import {
  buildInitialStoreChannelSettings,
  createDefaultStoreChannelConfig,
  ensureStoreChannelSettingsForBusinesses,
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

  it("never returns undefined when store settings are missing", () => {
    expect(getStoreChannelConfig({}, "shami")).toEqual({ channels: [], activeIds: [] });
    expect(resolveStoreChannelConfig({}, "unknown-store", defaultConfig)).toEqual(defaultConfig);
    expect(getStoreChannelConfig(
      { shami: { channels: null, activeIds: null } as unknown as typeof defaultConfig },
      "shami",
      defaultConfig,
    )).toEqual(defaultConfig);
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

  it("ensures default channel settings for new businesses", () => {
    const next = ensureStoreChannelSettingsForBusinesses({}, ["shami"], defaultConfig);
    expect(next.shami.activeIds).toEqual(["cash", "mada"]);
    expect(ensureStoreChannelSettingsForBusinesses(next, ["shami"], defaultConfig)).toBe(next);
  });

  it("skips prototype defaults when DB org config is the source", () => {
    const next = ensureStoreChannelSettingsForBusinesses(
      {},
      ["302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c"],
      defaultConfig,
      { allowLocalDefaults: false },
    );
    expect(next["302cf87a-b3cf-43f8-bb5d-afd2ab6d8a4c"]).toEqual({ channels: [], activeIds: [] });
  });
});
