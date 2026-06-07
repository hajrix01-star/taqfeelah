import { readLocalSavedSettings } from "@/features/runtime-settings/client/read-local-saved-settings";

/**
 * @param {Object} deps
 * @param {boolean} deps.bindsToServerAuth
 * @param {string} deps.storageKey
 * @param {string} deps.closeoutAlertsKey
 * @param {(raw: unknown, options: Record<string, unknown>) => unknown} deps.applyMigration
 * @param {(reviewEnabled: () => boolean) => void} deps.autoResolveCloseouts
 */
export function createMigrateSavedSettings({
  bindsToServerAuth,
  storageKey,
  closeoutAlertsKey,
  applyMigration,
  autoResolveCloseouts,
}) {
  return function migrateSavedSettings(raw) {
    return applyMigration(raw, {
      skip: !raw || typeof window === "undefined" || bindsToServerAuth,
      persistMigrated: (migrated) => {
        window.localStorage.setItem(storageKey, JSON.stringify(migrated));
      },
      clearCloseoutAlerts: () => {
        window.localStorage.removeItem(closeoutAlertsKey);
      },
      resolveCloseouts: () => {
        autoResolveCloseouts(() => false);
      },
    });
  };
}

/**
 * @param {Object} deps
 * @param {boolean} deps.enabled
 * @param {(raw: unknown) => unknown} deps.migrate
 */
export function createReadSavedSettings({ enabled, migrate }) {
  return function readSavedSettings() {
    return readLocalSavedSettings({ enabled, migrate });
  };
}
