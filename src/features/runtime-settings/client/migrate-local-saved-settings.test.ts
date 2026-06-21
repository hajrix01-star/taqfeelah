import { describe, expect, it, vi } from "vitest";
import {
  migrateSavedSettings,
  migrateSavedSettingsBlob,
} from "./migrate-local-saved-settings";

describe("migrate local saved settings", () => {
  it("normalizes per-store operational settings and strips legacy review keys", () => {
    const migrated = migrateSavedSettingsBlob({
      storeOperationalSettings: {
        shami: {
          reviewEnabled: true,
          attachmentAlert: true,
          closeoutAlert: true,
          closeoutReviewEnabled: true,
          employeeHistoryVisibility: "week",
        },
      },
    });

    expect((migrated?.storeOperationalSettings as Record<string, Record<string, unknown>> | undefined)?.shami).toMatchObject({
      closeoutAlert: true,
      employeeHistoryVisibility: "week",
    });
    expect((migrated?.storeOperationalSettings as Record<string, Record<string, unknown>> | undefined)?.shami).not.toHaveProperty("reviewEnabled");
    expect((migrated?.storeOperationalSettings as Record<string, Record<string, unknown>> | undefined)?.shami).not.toHaveProperty("attachmentAlert");
    expect((migrated?.storeOperationalSettings as Record<string, Record<string, unknown>> | undefined)?.shami).not.toHaveProperty("closeoutReviewEnabled");
  });

  it("returns raw settings when store operational settings are already normalized", () => {
    const raw = {
      storeOperationalSettings: {
        shami: {
          closeoutAlert: false,
          employeeHistoryVisibility: "all",
          activeCategories: ["fuel", "maintenance", "supplies", "other"],
          notebookTheme: null,
        },
      },
    };
    expect(migrateSavedSettingsBlob(raw)).toEqual(raw);
  });

  it("runs side effects only when migration changes settings", () => {
    const persistMigrated = vi.fn();
    const clearCloseoutAlerts = vi.fn();
    const resolveCloseouts = vi.fn();

    migrateSavedSettings(
      {
        storeOperationalSettings: {
          shami: { reviewEnabled: true, closeoutAlert: true },
        },
      },
      { persistMigrated, clearCloseoutAlerts, resolveCloseouts },
    );

    expect(persistMigrated).toHaveBeenCalledOnce();
    expect(clearCloseoutAlerts).toHaveBeenCalledOnce();
    expect(resolveCloseouts).toHaveBeenCalledOnce();
  });

  it("skips migration when skip flag is set", () => {
    const persistMigrated = vi.fn();
    const migrated = migrateSavedSettings(
      { storeOperationalSettings: { shami: { reviewEnabled: true } } },
      { skip: true, persistMigrated },
    );

    expect((migrated?.storeOperationalSettings as Record<string, Record<string, unknown>> | undefined)?.shami).toMatchObject({ reviewEnabled: true });
    expect(persistMigrated).not.toHaveBeenCalled();
  });
});
