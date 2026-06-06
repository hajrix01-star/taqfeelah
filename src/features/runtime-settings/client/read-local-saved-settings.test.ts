import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OWNER_SETTINGS_STORAGE_KEY } from "./migrate-local-saved-settings";
import { readLocalSavedSettings, readLocalSavedSettingsRaw } from "./read-local-saved-settings";

describe("read local saved settings", () => {
  const getItem = vi.fn();

  beforeEach(() => {
    getItem.mockReset();
    vi.stubGlobal("window", {
      localStorage: { getItem },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null when local storage reads are disabled", () => {
    getItem.mockReturnValue(JSON.stringify({ reviewEnabled: true }));
    expect(readLocalSavedSettings({ enabled: false })).toBeNull();
    expect(getItem).not.toHaveBeenCalled();
  });

  it("reads and migrates saved settings from local storage", () => {
    getItem.mockReturnValue(JSON.stringify({ reviewEnabled: true }));
    const migrate = vi.fn((raw) => ({ ...raw, migrated: true }));

    const settings = readLocalSavedSettings({ migrate });

    expect(getItem).toHaveBeenCalledWith(OWNER_SETTINGS_STORAGE_KEY);
    expect(migrate).toHaveBeenCalledWith({ reviewEnabled: true });
    expect(settings).toEqual({ reviewEnabled: true, migrated: true });
  });

  it("returns null when local storage contains invalid json", () => {
    getItem.mockReturnValue("{bad json");
    expect(readLocalSavedSettingsRaw()).toBeNull();
  });
});
