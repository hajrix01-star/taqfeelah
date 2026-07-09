import { OWNER_SETTINGS_STORAGE_KEY } from "@/features/runtime-settings/client/migrate-local-saved-settings";
import { safeSetLocalStorageItem } from "@/core/client/safe-local-storage";
import type { StaffMember, StoreChannelConfig } from "./org-config-client-types";

export function buildOwnerSettingsLocalStoragePayload({
  configuredBusinesses,
  archivedBusinessIds,
  storeChannelSettings,
  storeOperationalSettings,
  notebookTheme,
  notebookPattern = "lined",
  employeePreferences = {},
  ownerShellPreferences = {},
  staff,
  ownerProfile,
  authOwnerUsername,
  authOwnerPassword,
  authEmployeePins,
}: {
  configuredBusinesses: Array<Record<string, unknown>>;
  archivedBusinessIds: string[];
  storeChannelSettings: Record<string, StoreChannelConfig>;
  storeOperationalSettings: Record<string, unknown>;
  notebookTheme: string;
  notebookPattern?: string;
  employeePreferences?: Record<string, unknown>;
  ownerShellPreferences?: Record<string, unknown>;
  staff: Array<Record<string, unknown>>;
  ownerProfile: Record<string, unknown>;
  authOwnerUsername: string;
  authOwnerPassword: string;
  authEmployeePins: Record<string, string>;
}) {
  return {
    configuredBusinesses,
    archivedBusinessIds,
    storeChannelSettings,
    storeOperationalSettings,
    notebookTheme,
    notebookPattern,
    employeePreferences,
    ownerShellPreferences,
    staff,
    ownerProfile,
    authConfig: {
      ownerUsername: authOwnerUsername,
      ownerPassword: authOwnerPassword,
      employeePins: authEmployeePins,
    },
  };
}

export function persistOwnerSettingsToLocalStorage(
  payload: Record<string, unknown>,
  {
    enabled = true,
    storageKey = OWNER_SETTINGS_STORAGE_KEY,
  }: {
    enabled?: boolean;
    storageKey?: string;
  } = {},
) {
  if (!enabled) return false;
  return safeSetLocalStorageItem(storageKey, JSON.stringify(payload), {
    scope: "local-settings-migration",
  }).ok;
}

export function normalizeTeamEmployeePins({
  authEmployeePins = {},
  draftAuthEmployeePins = {},
  staff = [],
}: {
  authEmployeePins?: Record<string, string>;
  draftAuthEmployeePins?: Record<string, string>;
  staff?: StaffMember[];
} = {}) {
  const allowedIds = new Set(staff.map((person) => person.id));
  return Object.fromEntries(
    Object.entries({ ...authEmployeePins, ...draftAuthEmployeePins })
      .filter(([personId]) => allowedIds.has(personId)),
  );
}

export function buildOwnerSettingsTeamPersistPayload({
  staff,
  authOwnerUsername,
  authOwnerPassword,
  authEmployeePins,
  draftAuthEmployeePins,
  omitStaff = false,
  omitEmployeePins = false,
}: {
  staff: Array<Record<string, unknown>>;
  authOwnerUsername: string;
  authOwnerPassword: string;
  authEmployeePins?: Record<string, string>;
  draftAuthEmployeePins?: Record<string, string>;
  omitStaff?: boolean;
  omitEmployeePins?: boolean;
}) {
  return {
    ...(omitStaff ? {} : { staff }),
    authConfig: {
      ownerUsername: authOwnerUsername,
      ownerPassword: authOwnerPassword,
      employeePins: omitEmployeePins
        ? {}
        : normalizeTeamEmployeePins({
          authEmployeePins,
          draftAuthEmployeePins,
          staff: staff as StaffMember[],
        }),
    },
  };
}
