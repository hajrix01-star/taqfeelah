import { normalizeStoreOperationalSettings } from "@/domain/store-operational-settings/normalize";

export const DISABLE_REVIEW_ALERTS_MIGRATION_KEY = "disableReviewAlertsV1";
export const OWNER_SETTINGS_STORAGE_KEY = "taqfeelah_owner_settings";

export function migrateSavedSettingsBlob(raw) {
  if (!raw || typeof raw !== "object") return raw;

  if (raw.storeOperationalSettings && typeof raw.storeOperationalSettings === "object") {
    return {
      ...raw,
      storeOperationalSettings: Object.fromEntries(
        Object.entries(raw.storeOperationalSettings).map(([id, cfg]) => [
          id,
          normalizeStoreOperationalSettings(cfg),
        ]),
      ),
    };
  }

  return raw;
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
