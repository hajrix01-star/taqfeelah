import type { DisplayLang } from "@/core/i18n/display-locale";
import type { JsonStringMap } from "@/core/client/client-types";

export type RuntimeSettingsAuth = {
  organizationId?: string;
  actorUserId?: string;
  actorRole?: string;
  sessionOrganizationId?: string;
  sessionUserId?: string;
};

export type ReadLocalSavedSettingsOptions = {
  enabled?: boolean;
  migrate?: (raw: Record<string, unknown> | null) => Record<string, unknown> | null;
  storageKey?: string;
};

export type RuntimeSettingsSnapshotInput = {
  orgConfigApiEnabled?: boolean;
  storeOperationalSettings?: Record<string, unknown>;
  notebookTheme?: string;
  employeePreferences?: Record<string, unknown>;
  ownerShellPreferences?: Record<string, unknown>;
  ownerProfile?: Record<string, unknown>;
  authConfig?: Record<string, unknown>;
  configuredBusinesses?: unknown[];
  archivedBusinessIds?: string[];
  storeChannelSettings?: Record<string, unknown>;
  staff?: unknown[];
};

export type RuntimeSettingsApplyHandlers = Record<string, ((value: unknown) => void) | undefined>;

export type ApplyRuntimeSettingsSnapshotPatchInput = {
  migrated: Record<string, unknown> | null | undefined;
  orgConfigApiEnabled?: boolean;
  apply: RuntimeSettingsApplyHandlers;
};

export type UseRuntimeSettingsFromApiProps = {
  enabled?: boolean;
  auth?: RuntimeSettingsAuth;
  loggedIn?: boolean;
  isEmployee?: boolean;
  lang?: DisplayLang;
  snapshot?: Record<string, unknown>;
  onHydrate?: (settings: Record<string, unknown>) => void;
  autosaveDelayMs?: number;
};

export type UseEmployeePreferencesFromApiProps = {
  enabled?: boolean;
  loggedIn?: boolean;
  isEmployee?: boolean;
  lang?: DisplayLang;
  onHydrateTheme?: (theme: string) => void;
};

export type EmployeePreferencesPayload = {
  preferences?: {
    notebookTheme?: string;
  };
};
