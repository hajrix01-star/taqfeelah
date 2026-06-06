import { describe, expect, it, vi } from "vitest";
import {
  applyOrgConfigMappedState,
  buildOrgConfigRuntimeSnapshot,
} from "./org-config-runtime-bridge";

describe("org config runtime bridge", () => {
  it("builds snapshot from runtime org-config state", () => {
    const snapshot = buildOrgConfigRuntimeSnapshot({
      configuredBusinesses: [{ id: "shami" }],
      archivedBusinessIds: [],
      storeChannelSettings: { shami: { channels: [], activeIds: [] } },
      storeOperationalSettings: { shami: { reviewEnabled: true } },
      staff: [{ id: "ahmed" }],
    });

    expect(snapshot.configuredBusinesses).toHaveLength(1);
    expect(snapshot.storeOperationalSettings.shami.reviewEnabled).toBe(true);
  });

  it("applies hydrated org-config payload to runtime setters", () => {
    const setConfiguredBusinesses = vi.fn();
    const setArchivedBusinessIds = vi.fn();
    const setStoreChannelSettings = vi.fn();
    const setStoreOperationalSettings = vi.fn();
    const setStaff = vi.fn();

    applyOrgConfigMappedState({
      configuredBusinesses: [{ id: "arz" }],
      archivedBusinessIds: ["old-store"],
      storeChannelSettings: { arz: { channels: [], activeIds: ["cash"] } },
      storeOperationalSettings: { arz: { closeoutReviewEnabled: true } },
      staff: [{ id: "sara" }],
    }, {
      setConfiguredBusinesses,
      setArchivedBusinessIds,
      setStoreChannelSettings,
      setStoreOperationalSettings,
      setStaff,
    });

    expect(setConfiguredBusinesses).toHaveBeenCalledWith([{ id: "arz" }]);
    expect(setArchivedBusinessIds).toHaveBeenCalledWith(["old-store"]);
    expect(setStoreChannelSettings).toHaveBeenCalledWith({ arz: { channels: [], activeIds: ["cash"] } });
    expect(setStoreOperationalSettings).toHaveBeenCalledWith({ arz: { closeoutReviewEnabled: true } });
    expect(setStaff).toHaveBeenCalledWith([{ id: "sara" }]);
  });
});
