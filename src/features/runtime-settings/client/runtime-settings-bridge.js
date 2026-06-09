import { isEntriesApiDbSourceMode } from "@/core/config/entries-api-mode";
import { bindsToServerAuth, usesRuntimeSettingsApi } from "@/core/config/runtime-capabilities";
import { isValidNotebookTheme } from "@/features/daily-closeouts/notebook-themes";
import { isUuid } from "@/core/client/api-id-utils";

export { bindsToServerAuth, usesRuntimeSettingsApi };

/**
 * Resolve API auth headers for owner settings/org-config calls.
 * Production server-auth uses the signed-in session; prototype/DB-dev uses env UUIDs.
 */
export function resolveOwnerSettingsApiAuth({
  sessionOrganizationId = "",
  sessionUserId = "",
  actorRole = "owner",
} = {}) {
  if (bindsToServerAuth()) {
    return {
      organizationId: isUuid(sessionOrganizationId) ? sessionOrganizationId : "",
      actorUserId: isUuid(sessionUserId) ? sessionUserId : "",
      actorRole,
    };
  }
  if (!isEntriesApiDbSourceMode()) return {};
  return {
    organizationId: process.env.NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID || "",
    actorUserId: process.env.NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID || "owner",
    actorRole: "owner",
  };
}

/** @deprecated Use resolveOwnerSettingsApiAuth with explicit session context. */
export function readOwnerSettingsApiAuth() {
  return resolveOwnerSettingsApiAuth();
}

export function buildRuntimeSettingsSnapshot({
  orgConfigApiEnabled,
  storeOperationalSettings,
  notebookTheme,
  employeePreferences,
  ownerShellPreferences,
  ownerProfile,
  authConfig,
  configuredBusinesses,
  archivedBusinessIds,
  storeChannelSettings,
  staff,
}) {
  const shared = {
    storeOperationalSettings,
    notebookTheme,
    employeePreferences,
    ownerShellPreferences,
    ownerProfile,
    authConfig,
  };
  if (orgConfigApiEnabled) return shared;
  return {
    configuredBusinesses,
    archivedBusinessIds,
    storeChannelSettings,
    ...shared,
    staff,
  };
}

export function serializeRuntimeSettingsSignature(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

export function buildRuntimeSettingsPersistPayload(runtimeSettingsSnapshot, partialSettings = {}) {
  return {
    ...runtimeSettingsSnapshot,
    ...partialSettings,
    authConfig: {
      ...runtimeSettingsSnapshot.authConfig,
      ...(partialSettings.authConfig && typeof partialSettings.authConfig === "object"
        ? partialSettings.authConfig
        : {}),
    },
  };
}

export function applyRuntimeSettingsSnapshotPatch({ migrated, orgConfigApiEnabled, apply }) {
  if (!migrated || typeof migrated !== "object") return;

  if (!orgConfigApiEnabled) {
    if (Array.isArray(migrated.configuredBusinesses) && apply.setConfiguredBusinesses) {
      apply.setConfiguredBusinesses(migrated.configuredBusinesses);
    }
    if (Array.isArray(migrated.archivedBusinessIds) && apply.setArchivedBusinessIds) {
      apply.setArchivedBusinessIds(migrated.archivedBusinessIds);
    }
    if (migrated.storeChannelSettings && typeof migrated.storeChannelSettings === "object" && apply.setStoreChannelSettings) {
      apply.setStoreChannelSettings(migrated.storeChannelSettings);
    }
    if (Array.isArray(migrated.staff) && apply.setStaff) {
      apply.setStaff(migrated.staff);
    }
  }

  if (migrated.storeOperationalSettings && typeof migrated.storeOperationalSettings === "object" && apply.setStoreOperationalSettings) {
    apply.setStoreOperationalSettings(migrated.storeOperationalSettings);
  }
  if (typeof migrated.notebookTheme === "string" && isValidNotebookTheme(migrated.notebookTheme) && apply.setNotebookTheme) {
    apply.setNotebookTheme(migrated.notebookTheme);
  }
  if (migrated.employeePreferences && typeof migrated.employeePreferences === "object" && apply.setEmployeePreferences) {
    apply.setEmployeePreferences(migrated.employeePreferences);
  }
  if (migrated.ownerShellPreferences && typeof migrated.ownerShellPreferences === "object" && apply.setOwnerShellPreferences) {
    apply.setOwnerShellPreferences(migrated.ownerShellPreferences);
  }
  if (migrated.ownerProfile && typeof migrated.ownerProfile === "object" && apply.setOwnerProfile) {
    apply.setOwnerProfile(migrated.ownerProfile);
  }
  if (migrated.authConfig && typeof migrated.authConfig === "object") {
    if (typeof migrated.authConfig.ownerUsername === "string" && migrated.authConfig.ownerUsername.trim() && apply.setAuthOwnerUsername) {
      apply.setAuthOwnerUsername(migrated.authConfig.ownerUsername.trim());
    }
    if (typeof migrated.authConfig.ownerPassword === "string" && migrated.authConfig.ownerPassword.trim() && apply.setAuthOwnerPassword) {
      apply.setAuthOwnerPassword(migrated.authConfig.ownerPassword);
    }
    if (migrated.authConfig.employeePins && typeof migrated.authConfig.employeePins === "object" && apply.setAuthEmployeePins) {
      apply.setAuthEmployeePins(migrated.authConfig.employeePins);
    }
  }
}
