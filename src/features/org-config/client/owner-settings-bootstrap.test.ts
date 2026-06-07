import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMigrateSavedSettings,
  createReadSavedSettings,
} from "./owner-settings-bootstrap";

describe("owner settings bootstrap", () => {
  const setItem = vi.fn();
  const removeItem = vi.fn();

  beforeEach(() => {
    setItem.mockReset();
    removeItem.mockReset();
    vi.stubGlobal("window", {
      localStorage: { setItem, removeItem },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates migrate helper with persistence side effects", () => {
    const applyMigration = vi.fn((_raw, options) => {
      options.persistMigrated({ staff: [] });
      options.clearCloseoutAlerts();
      options.resolveCloseouts();
      return { migrated: true };
    });
    const autoResolveCloseouts = vi.fn();

    const migrate = createMigrateSavedSettings({
      bindsToServerAuth: false,
      storageKey: "taqfeelah_settings",
      closeoutAlertsKey: "taqfeelah_alerts",
      applyMigration,
      autoResolveCloseouts,
    });

    expect(migrate({ staff: [] })).toEqual({ migrated: true });
    expect(setItem).toHaveBeenCalledWith("taqfeelah_settings", JSON.stringify({ staff: [] }));
    expect(removeItem).toHaveBeenCalledWith("taqfeelah_alerts");
    expect(autoResolveCloseouts).toHaveBeenCalledOnce();
  });

  it("creates read helper that delegates to local reader", () => {
    const migrate = vi.fn((raw) => raw);
    const read = createReadSavedSettings({ enabled: true, migrate });
    expect(read()).toBeNull();
  });
});
