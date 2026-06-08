import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OWNER_SETTINGS_STORAGE_KEY } from "@/features/runtime-settings/client/migrate-local-saved-settings";
import {
  buildOwnerSettingsLocalStoragePayload,
  buildOwnerSettingsTeamPersistPayload,
  normalizeTeamEmployeePins,
  persistOwnerSettingsToLocalStorage,
} from "./owner-settings-local-persistence";

describe("owner settings local persistence", () => {
  const setItem = vi.fn();

  beforeEach(() => {
    setItem.mockReset();
    vi.stubGlobal("window", {
      localStorage: { setItem },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("builds local storage payload with auth config envelope", () => {
    const payload = buildOwnerSettingsLocalStoragePayload({
      configuredBusinesses: [{ id: "shami" }],
      archivedBusinessIds: [],
      storeChannelSettings: {},
      storeOperationalSettings: {},
      notebookTheme: "yellow",
      staff: [{ id: "ahmed" }],
      ownerProfile: { name: "Owner" },
      authOwnerUsername: "owner",
      authOwnerPassword: "demo",
      authEmployeePins: { ahmed: "1234" },
    });

    expect(payload.authConfig).toEqual({
      ownerUsername: "owner",
      ownerPassword: "demo",
      employeePins: { ahmed: "1234" },
    });
  });

  it("persists payload to local storage when enabled", () => {
    const payload = { notebookTheme: "ivory" };
    expect(persistOwnerSettingsToLocalStorage(payload)).toBe(true);
    expect(setItem).toHaveBeenCalledWith(OWNER_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
  });

  it("skips local storage writes when disabled", () => {
    expect(persistOwnerSettingsToLocalStorage({ staff: [] }, { enabled: false })).toBe(false);
    expect(setItem).not.toHaveBeenCalled();
  });

  it("skips local storage writes in production app mode", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_MODE", "production");

    expect(persistOwnerSettingsToLocalStorage({ notebookTheme: "yellow" })).toBe(false);
    expect(setItem).not.toHaveBeenCalled();
  });

  it("filters employee pins to active staff ids", () => {
    expect(normalizeTeamEmployeePins({
      authEmployeePins: { ahmed: "1111", old: "0000" },
      draftAuthEmployeePins: { sara: "2222" },
      staff: [{ id: "ahmed" }, { id: "sara" }],
    })).toEqual({
      ahmed: "1111",
      sara: "2222",
    });
  });

  it("builds team persist payload for explicit server save", () => {
    const payload = buildOwnerSettingsTeamPersistPayload({
      staff: [{ id: "ahmed", pin: "1234" }],
      authOwnerUsername: "owner",
      authOwnerPassword: "demo",
      authEmployeePins: {},
      draftAuthEmployeePins: { ahmed: "9999" },
    });

    expect(payload.staff).toHaveLength(1);
    expect(payload.authConfig.employeePins).toEqual({ ahmed: "9999" });
  });
});
