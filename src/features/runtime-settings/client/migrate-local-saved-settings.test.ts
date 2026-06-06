import { describe, expect, it, vi } from "vitest";
import {
  DISABLE_REVIEW_ALERTS_MIGRATION_KEY,
  migrateSavedSettings,
  migrateSavedSettingsBlob,
} from "./migrate-local-saved-settings";

describe("migrate local saved settings", () => {
  it("disables legacy review flags on first migration", () => {
    const migrated = migrateSavedSettingsBlob({
      reviewEnabled: true,
      closeoutAlert: true,
      attachmentAlert: true,
      closeoutReviewEnabled: true,
    });

    expect(migrated[DISABLE_REVIEW_ALERTS_MIGRATION_KEY]).toBe(true);
    expect(migrated.reviewEnabled).toBe(false);
    expect(migrated.closeoutAlert).toBe(false);
    expect(migrated.attachmentAlert).toBe(false);
    expect(migrated.closeoutReviewEnabled).toBe(false);
  });

  it("disables per-store review flags on first migration", () => {
    const migrated = migrateSavedSettingsBlob({
      storeOperationalSettings: {
        shami: {
          reviewEnabled: true,
          attachmentAlert: true,
          closeoutAlert: true,
          closeoutReviewEnabled: true,
        },
      },
    });

    expect(migrated.storeOperationalSettings.shami).toMatchObject({
      reviewEnabled: false,
      attachmentAlert: false,
      closeoutAlert: false,
      closeoutReviewEnabled: false,
    });
  });

  it("returns raw settings when migration already applied", () => {
    const raw = { [DISABLE_REVIEW_ALERTS_MIGRATION_KEY]: true, reviewEnabled: true };
    expect(migrateSavedSettingsBlob(raw)).toBe(raw);
  });

  it("runs side effects only when migration changes settings", () => {
    const persistMigrated = vi.fn();
    const clearCloseoutAlerts = vi.fn();
    const resolveCloseouts = vi.fn();

    migrateSavedSettings(
      { reviewEnabled: true },
      { persistMigrated, clearCloseoutAlerts, resolveCloseouts },
    );

    expect(persistMigrated).toHaveBeenCalledOnce();
    expect(clearCloseoutAlerts).toHaveBeenCalledOnce();
    expect(resolveCloseouts).toHaveBeenCalledOnce();
  });

  it("skips migration when skip flag is set", () => {
    const persistMigrated = vi.fn();
    const migrated = migrateSavedSettings(
      { reviewEnabled: true },
      { skip: true, persistMigrated },
    );

    expect(migrated.reviewEnabled).toBe(true);
    expect(persistMigrated).not.toHaveBeenCalled();
  });
});
