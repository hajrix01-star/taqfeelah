import { OWNER_SETTINGS_STORAGE_KEY } from "./migrate-local-saved-settings";
import { isBrowserPersistentStorageAllowed } from "@/core/config/browser-persistence-policy";

export function readLocalSavedSettingsRaw(storageKey = OWNER_SETTINGS_STORAGE_KEY) {
  if (!isBrowserPersistentStorageAllowed({ scope: "legacy-settings" })) return null;
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) || "null");
  } catch {
    return null;
  }
}

/**
 * @typedef {Object} ReadLocalSavedSettingsOptions
 * @property {boolean} [enabled]
 * @property {(raw: Record<string, unknown> | null) => Record<string, unknown> | null} [migrate]
 * @property {string} [storageKey]
 */

/**
 * @param {ReadLocalSavedSettingsOptions} [options]
 */
export function readLocalSavedSettings({
  enabled = true,
  migrate,
  storageKey = OWNER_SETTINGS_STORAGE_KEY,
} = {}) {
  if (!enabled || typeof window === "undefined") return null;
  const raw = readLocalSavedSettingsRaw(storageKey);
  if (typeof migrate === "function") {
    return migrate(raw);
  }
  return raw;
}
