import { isEntriesApiDbSourceMode } from "@/core/config/entries-api-mode";
import { isCloseoutsApiDbSourceMode } from "@/core/config/closeouts-api-mode";
import { isOrgConfigApiEnabled } from "@/core/config/org-config-api-mode";
import { bindsToServerAuth, usesRuntimeSettingsApi } from "@/core/config/runtime-capabilities";
import { isValidNotebookTheme } from "@/features/daily-closeouts/notebook-themes";
import { isUuid } from "@/core/client/api-id-utils";
import type {
  ApplyRuntimeSettingsSnapshotPatchInput,
  RuntimeSettingsAuth,
  RuntimeSettingsSnapshotInput,
} from "@/features/runtime-settings/client/runtime-settings-client-types";

export { bindsToServerAuth, usesRuntimeSettingsApi };

export function resolveOwnerSettingsApiAuth({
  sessionOrganizationId = "",
  sessionUserId = "",
  actorRole = "owner",
}: RuntimeSettingsAuth = {}): RuntimeSettingsAuth {
  const sessionOrg = isUuid(sessionOrganizationId) ? sessionOrganizationId : "";
  const sessionUser = isUuid(sessionUserId) ? sessionUserId : "";

  if (bindsToServerAuth() || sessionOrg || sessionUser) {
    return {
      organizationId: sessionOrg,
      actorUserId: sessionUser,
      actorRole,
    };
  }
  const usesDbApis = isEntriesApiDbSourceMode()
    || isCloseoutsApiDbSourceMode()
    || isOrgConfigApiEnabled();
  if (!usesDbApis) return {};
  const envOrg = process.env.NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID || "";
  const envOwner = process.env.NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID || "";
  return {
    organizationId: isUuid(envOrg) ? envOrg : "",
    actorUserId: isUuid(envOwner) ? envOwner : "",
    actorRole,
  };
}

/** @deprecated Use resolveOwnerSettingsApiAuth with explicit session context. */
export function readOwnerSettingsApiAuth(): RuntimeSettingsAuth {
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
}: RuntimeSettingsSnapshotInput): Record<string, unknown> {
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

export function serializeRuntimeSettingsSignature(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

export function buildRuntimeSettingsPersistPayload(
  runtimeSettingsSnapshot: Record<string, unknown>,
  partialSettings: Record<string, unknown> = {},
): Record<string, unknown> {
  const merged = {
    ...runtimeSettingsSnapshot,
    ...partialSettings,
    authConfig: {
      ...(runtimeSettingsSnapshot.authConfig as Record<string, unknown> | undefined),
      ...(partialSettings.authConfig && typeof partialSettings.authConfig === "object"
        ? partialSettings.authConfig as Record<string, unknown>
        : {}),
    },
  };

  if (bindsToServerAuth()) {
    const { authConfig: _authConfig, ...rest } = merged as Record<string, unknown> & { authConfig?: unknown };
    return rest;
  }

  return merged;
}

export function applyRuntimeSettingsSnapshotPatch({
  migrated,
  orgConfigApiEnabled,
  apply,
}: ApplyRuntimeSettingsSnapshotPatchInput): void {
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
    const authConfig = migrated.authConfig as Record<string, unknown>;
    if (typeof authConfig.ownerUsername === "string" && authConfig.ownerUsername.trim() && apply.setAuthOwnerUsername) {
      apply.setAuthOwnerUsername(authConfig.ownerUsername.trim());
    }
    if (typeof authConfig.ownerLoginPhone === "string" && authConfig.ownerLoginPhone.trim() && apply.setOwnerLoginPhone) {
      apply.setOwnerLoginPhone(authConfig.ownerLoginPhone.trim());
    }
    if (!bindsToServerAuth()) {
      if (typeof authConfig.ownerPassword === "string" && authConfig.ownerPassword.trim() && apply.setAuthOwnerPassword) {
        apply.setAuthOwnerPassword(authConfig.ownerPassword);
      }
    } else if (apply.setAuthOwnerPassword) {
      apply.setAuthOwnerPassword("");
    }
    if (authConfig.employeePins && typeof authConfig.employeePins === "object" && apply.setAuthEmployeePins) {
      apply.setAuthEmployeePins(authConfig.employeePins);
    }
  }
  if (migrated.ownerContact && typeof migrated.ownerContact === "object") {
    const ownerContact = migrated.ownerContact as Record<string, unknown>;
    if (typeof ownerContact.email === "string" && apply.setOwnerContactEmail) {
      apply.setOwnerContactEmail(ownerContact.email.trim());
    }
    if (typeof ownerContact.loginPhone === "string" && apply.setOwnerContactLoginPhone) {
      apply.setOwnerContactLoginPhone(ownerContact.loginPhone.trim());
    }
  }
}
