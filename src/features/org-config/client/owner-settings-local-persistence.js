import { OWNER_SETTINGS_STORAGE_KEY } from "@/features/runtime-settings/client/migrate-local-saved-settings";
import { isBrowserPersistentStorageAllowed } from "@/core/config/browser-persistence-policy";

export function buildOwnerSettingsLocalStoragePayload({
  configuredBusinesses,
  archivedBusinessIds,
  storeChannelSettings,
  storeOperationalSettings,
  notebookTheme,
  employeePreferences = {},
  staff,
  ownerProfile,
  authOwnerUsername,
  authOwnerPassword,
  authEmployeePins,
}) {
  return {
    configuredBusinesses,
    archivedBusinessIds,
    storeChannelSettings,
    storeOperationalSettings,
    notebookTheme,
    employeePreferences,
    staff,
    ownerProfile,
    authConfig: {
      ownerUsername: authOwnerUsername,
      ownerPassword: authOwnerPassword,
      employeePins: authEmployeePins,
    },
  };
}

/**
 * @typedef {Object} PersistOwnerSettingsOptions
 * @property {boolean} [enabled]
 * @property {string} [storageKey]
 */

/**
 * @param {Record<string, unknown>} payload
 * @param {PersistOwnerSettingsOptions} [options]
 */
export function persistOwnerSettingsToLocalStorage(payload, {
  enabled = true,
  storageKey = OWNER_SETTINGS_STORAGE_KEY,
} = {}) {
  if (!isBrowserPersistentStorageAllowed({ scope: "legacy-settings" })) return false;
  if (!enabled || typeof window === "undefined") return false;
  window.localStorage.setItem(storageKey, JSON.stringify(payload));
  return true;
}

/**
 * @typedef {Object} TeamEmployeePinOptions
 * @property {Record<string, string>} [authEmployeePins]
 * @property {Record<string, string>} [draftAuthEmployeePins]
 * @property {Array<{ id: string }>} [staff]
 */

/**
 * @param {TeamEmployeePinOptions} [options]
 */
export function normalizeTeamEmployeePins({
  authEmployeePins = {},
  draftAuthEmployeePins = {},
  staff = [],
} = {}) {
  const allowedIds = new Set(staff.map((person) => person.id));
  return Object.fromEntries(
    Object.entries({ ...authEmployeePins, ...draftAuthEmployeePins })
      .filter(([personId]) => allowedIds.has(personId)),
  );
}

/**
 * @typedef {Object} OwnerSettingsTeamPersistInput
 * @property {Array<Record<string, unknown>>} staff
 * @property {string} authOwnerUsername
 * @property {string} authOwnerPassword
 * @property {Record<string, string>} [authEmployeePins]
 * @property {Record<string, string>} [draftAuthEmployeePins]
 */

/**
 * @param {OwnerSettingsTeamPersistInput} input
 */
export function buildOwnerSettingsTeamPersistPayload({
  staff,
  authOwnerUsername,
  authOwnerPassword,
  authEmployeePins,
  draftAuthEmployeePins,
}) {
  return {
    staff,
    authConfig: {
      ownerUsername: authOwnerUsername,
      ownerPassword: authOwnerPassword,
      employeePins: normalizeTeamEmployeePins({
        authEmployeePins,
        draftAuthEmployeePins,
        staff,
      }),
    },
  };
}
