export const DISABLE_REVIEW_ALERTS_MIGRATION_KEY = "disableReviewAlertsV1";
export const OWNER_SETTINGS_STORAGE_KEY = "taqfeelah_owner_settings";

export function migrateSavedSettingsBlob(raw) {
  if (!raw || raw[DISABLE_REVIEW_ALERTS_MIGRATION_KEY]) return raw;

  const migrated = { ...raw, [DISABLE_REVIEW_ALERTS_MIGRATION_KEY]: true };
  if (migrated.storeOperationalSettings) {
    migrated.storeOperationalSettings = Object.fromEntries(
      Object.entries(migrated.storeOperationalSettings).map(([id, cfg]) => [
        id,
        {
          ...cfg,
          reviewEnabled: false,
          attachmentAlert: false,
          closeoutAlert: false,
          closeoutReviewEnabled: false,
        },
      ]),
    );
  } else {
    migrated.reviewEnabled = false;
    migrated.closeoutAlert = false;
    migrated.attachmentAlert = false;
    migrated.closeoutReviewEnabled = false;
  }

  return migrated;
}

/**
 * @typedef {Object} MigrateSavedSettingsOptions
 * @property {boolean} [skip]
 * @property {(migrated: Record<string, unknown>) => void} [persistMigrated]
 * @property {() => void} [clearCloseoutAlerts]
 * @property {() => void} [resolveCloseouts]
 */

/**
 * @param {Record<string, unknown> | null | undefined} raw
 * @param {MigrateSavedSettingsOptions} [options]
 */
export function migrateSavedSettings(raw, {
  skip = false,
  persistMigrated,
  clearCloseoutAlerts,
  resolveCloseouts,
} = {}) {
  if (!raw || skip) return raw;

  const migrated = migrateSavedSettingsBlob(raw);
  if (migrated === raw) return raw;

  if (typeof persistMigrated === "function") {
    persistMigrated(migrated);
  }
  if (typeof clearCloseoutAlerts === "function") {
    clearCloseoutAlerts();
  }
  if (typeof resolveCloseouts === "function") {
    resolveCloseouts();
  }

  return migrated;
}
