"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isBrowserPersistentStorageAllowed } from "@/core/config/browser-persistence-policy";
import { isValidNotebookTheme } from "@/features/daily-closeouts/notebook-themes";
import { useOrgConfigRuntimeBridge } from "./org-config-runtime-bridge";
import {
  applyRuntimeSettingsSnapshotPatch,
  buildRuntimeSettingsSnapshot,
  resolveOwnerSettingsApiAuth,
  usesRuntimeSettingsApi,
} from "@/features/runtime-settings/client/runtime-settings-bridge";
import { useRuntimeSettingsFromApi } from "@/features/runtime-settings/client/use-runtime-settings-from-api";
import {
  buildInitialStoreOperationalSettings,
  buildStoreOperationalPolicy,
  ensureStoreOperationalSettingsForBusinesses,
} from "./store-operational-config";
import {
  buildInitialStoreChannelSettings,
  ensureStoreChannelSettingsForBusinesses,
  resolveStoreChannelConfig,
} from "./store-channel-config";
import { LAST_CLOSEOUT_STORAGE_KEY, readDemoLastCloseoutDates } from "./owner-settings-storage";
import type { OrgConfigApiAuth, StoreChannelConfig } from "./org-config-client-types";
import type { StoreOperationalSettings } from "@/domain/store-operational-settings/types";

function readAuthConfig(settings: Record<string, unknown> | null) {
  const authConfig = settings?.authConfig;
  return authConfig && typeof authConfig === "object" && !Array.isArray(authConfig)
    ? authConfig as Record<string, unknown>
    : {};
}

function readBusinessList(
  settings: Record<string, unknown> | null,
  fallback: Array<Record<string, unknown>>,
) {
  return Array.isArray(settings?.configuredBusinesses)
    ? settings.configuredBusinesses as Array<Record<string, unknown>>
    : fallback;
}

export function useOwnerSettingsState({
  bindsToServerAuth,
  orgConfigApiEnabled,
  closeoutsApiDbSource,
  sessionOrganizationId = "",
  sessionUserId = "",
  loggedIn,
  isEmployee,
  lang,
  readSavedSettings,
  migrateSavedSettings,
  defaultBusinesses,
  defaultStaff,
  prototypeOwnerUsername,
  prototypeOwnerPassword,
  defaultStoreChannelConfig,
  ownerActor,
  channelNameFn,
}: {
  bindsToServerAuth: boolean;
  orgConfigApiEnabled: boolean;
  closeoutsApiDbSource: boolean;
  sessionOrganizationId?: string;
  sessionUserId?: string;
  loggedIn: boolean;
  isEmployee: boolean;
  lang: "ar" | "en";
  readSavedSettings: () => Record<string, unknown> | null;
  migrateSavedSettings: (raw: unknown) => unknown;
  defaultBusinesses: Array<Record<string, unknown>>;
  defaultStaff: Array<Record<string, unknown>>;
  prototypeOwnerUsername: string;
  prototypeOwnerPassword: string;
  defaultStoreChannelConfig: StoreChannelConfig;
  ownerActor: Record<string, unknown>;
  channelNameFn: (channel: Record<string, unknown>, lang: "ar" | "en") => string;
}) {
  const initialSettings = readSavedSettings();
  const initialAuthConfig = readAuthConfig(initialSettings);
  const skipDemoBootstrap = bindsToServerAuth || orgConfigApiEnabled || closeoutsApiDbSource;
  const initialBusinesses = readBusinessList(
    initialSettings,
    skipDemoBootstrap ? [] : defaultBusinesses,
  );

  const [configuredBusinesses, setConfiguredBusinesses] = useState<Array<Record<string, unknown>>>(initialBusinesses);
  const [archivedBusinessIds, setArchivedBusinessIds] = useState<string[]>(
    Array.isArray(initialSettings?.archivedBusinessIds)
      ? initialSettings.archivedBusinessIds as string[]
      : Array.isArray(initialSettings?.archivedStores)
        ? initialSettings.archivedStores as string[]
        : [],
  );
  const [staff, setStaff] = useState<Array<Record<string, unknown>>>(
    Array.isArray(initialSettings?.staff)
      ? initialSettings.staff as Array<Record<string, unknown>>
      : (skipDemoBootstrap ? [] : defaultStaff),
  );
  const [ownerProfile, setOwnerProfile] = useState<Record<string, unknown>>(
    initialSettings?.ownerProfile && typeof initialSettings.ownerProfile === "object"
      ? initialSettings.ownerProfile as Record<string, unknown>
      : { name: "" },
  );
  const [storeChannelSettings, setStoreChannelSettings] = useState<Record<string, StoreChannelConfig>>(
    () => buildInitialStoreChannelSettings(
      initialSettings,
      initialBusinesses as Array<{ id: string } & Record<string, unknown>>,
      defaultStoreChannelConfig,
    ),
  );
  const [storeOperationalSettings, setStoreOperationalSettings] = useState<Record<string, StoreOperationalSettings>>(
    () => buildInitialStoreOperationalSettings(
      initialSettings,
      initialBusinesses as Array<{ id: string } & Record<string, unknown>>,
    ) as Record<string, StoreOperationalSettings>,
  );
  const [notebookTheme, setNotebookTheme] = useState<string>(() => {
    const savedTheme = initialSettings?.notebookTheme;
    if (isValidNotebookTheme(savedTheme)) return String(savedTheme);
    if (!isBrowserPersistentStorageAllowed({ scope: "ui-preferences" })) return "yellow";
    if (typeof window === "undefined") return "yellow";
    return window.localStorage.getItem("taqfeelah_notebook_theme") || "yellow";
  });
  const [employeePreferences, setEmployeePreferences] = useState<Record<string, unknown>>(
    () => (initialSettings?.employeePreferences && typeof initialSettings.employeePreferences === "object"
      ? initialSettings.employeePreferences as Record<string, unknown>
      : {}),
  );
  const [ownerShellPreferences, setOwnerShellPreferences] = useState<Record<string, unknown>>(
    () => (initialSettings?.ownerShellPreferences && typeof initialSettings.ownerShellPreferences === "object"
      ? initialSettings.ownerShellPreferences as Record<string, unknown>
      : {}),
  );
  const [authOwnerUsername, setAuthOwnerUsername] = useState(
    () => (bindsToServerAuth
      ? String(initialAuthConfig.ownerUsername || "").trim()
      : String(initialAuthConfig.ownerUsername || prototypeOwnerUsername || "hajri")),
  );
  const [authOwnerPassword, setAuthOwnerPassword] = useState(
    () => (bindsToServerAuth
      ? ""
      : String(initialAuthConfig.ownerPassword || prototypeOwnerPassword || "123")),
  );
  const [authEmployeePins, setAuthEmployeePins] = useState<Record<string, string>>(
    () => (initialAuthConfig.employeePins && typeof initialAuthConfig.employeePins === "object"
      ? initialAuthConfig.employeePins as Record<string, string>
      : {}),
  );
  const [lastCloseoutDates, setLastCloseoutDates] = useState(() => readDemoLastCloseoutDates(skipDemoBootstrap));

  const currentOwnerActor = useMemo(
    () => ({
      ...ownerActor,
      userId: sessionUserId || ownerActor?.userId || "owner",
      nameAr: String(ownerProfile.name || "").trim(),
      nameEn: String(ownerProfile.name || "").trim(),
    }),
    [ownerActor, ownerProfile.name, sessionUserId],
  );
  const ownerDisplayName = String(ownerProfile.name || "") || (lang === "ar" ? "المالك" : "Owner");

  const activeBusinesses = useMemo(
    () => configuredBusinesses.filter((business) => !archivedBusinessIds.includes(String(business.id))),
    [archivedBusinessIds, configuredBusinesses],
  );
  const reportingBusinesses = configuredBusinesses;

  const { closeoutAlertEnabledForBusiness } = useMemo(
    () => buildStoreOperationalPolicy(storeOperationalSettings),
    [storeOperationalSettings],
  );

  const runtimeSettingsSnapshot = useMemo(
    () => buildRuntimeSettingsSnapshot({
      orgConfigApiEnabled,
      storeOperationalSettings,
      notebookTheme,
      employeePreferences,
      ownerShellPreferences,
      ownerProfile,
      authConfig: {
        ownerUsername: authOwnerUsername,
        ownerPassword: authOwnerPassword,
        employeePins: authEmployeePins,
      },
      configuredBusinesses,
      archivedBusinessIds,
      storeChannelSettings,
      staff,
    }),
    [
      archivedBusinessIds,
      authEmployeePins,
      authOwnerPassword,
      authOwnerUsername,
      configuredBusinesses,
      employeePreferences,
      notebookTheme,
      orgConfigApiEnabled,
      ownerShellPreferences,
      ownerProfile,
      staff,
      storeChannelSettings,
      storeOperationalSettings,
    ],
  );

  const applyRuntimeSettingsSnapshot = useCallback((rawSettings: unknown) => {
    const migrated = migrateSavedSettings(rawSettings);
    applyRuntimeSettingsSnapshotPatch({
      migrated: migrated && typeof migrated === "object" && !Array.isArray(migrated)
        ? migrated as Record<string, unknown>
        : null,
      orgConfigApiEnabled,
      apply: {
        setConfiguredBusinesses: setConfiguredBusinesses as (value: unknown) => void,
        setArchivedBusinessIds: setArchivedBusinessIds as (value: unknown) => void,
        setStoreChannelSettings: setStoreChannelSettings as (value: unknown) => void,
        setStaff: setStaff as (value: unknown) => void,
        setStoreOperationalSettings: setStoreOperationalSettings as (value: unknown) => void,
        setNotebookTheme: setNotebookTheme as (value: unknown) => void,
        setEmployeePreferences: setEmployeePreferences as (value: unknown) => void,
        setOwnerShellPreferences: setOwnerShellPreferences as (value: unknown) => void,
        setOwnerProfile: setOwnerProfile as (value: unknown) => void,
        setAuthOwnerUsername: setAuthOwnerUsername as (value: unknown) => void,
        setAuthOwnerPassword: setAuthOwnerPassword as (value: unknown) => void,
        setAuthEmployeePins: setAuthEmployeePins as (value: unknown) => void,
      },
    });
  }, [migrateSavedSettings, orgConfigApiEnabled]);

  const ownerSettingsApiAuth = useMemo(
    (): OrgConfigApiAuth => {
      const resolved = resolveOwnerSettingsApiAuth({
        sessionOrganizationId,
        sessionUserId,
        actorRole: isEmployee ? "employee" : "owner",
      }) as Partial<OrgConfigApiAuth>;
      return {
        organizationId: resolved.organizationId || "",
        actorUserId: resolved.actorUserId || "",
        actorRole: resolved.actorRole || (isEmployee ? "employee" : "owner"),
      };
    },
    [isEmployee, sessionOrganizationId, sessionUserId],
  );

  const { error: orgConfigSyncError, loading: orgConfigLoading, hydrated: orgConfigHydrated, reload: reloadOrgConfig, flushPersist: flushOrgConfigPersist } = useOrgConfigRuntimeBridge({
    enabled: orgConfigApiEnabled && loggedIn && !isEmployee,
    auth: ownerSettingsApiAuth,
    loggedIn,
    isEmployee,
    employeePins: authEmployeePins,
    configuredBusinesses,
    archivedBusinessIds,
    storeChannelSettings,
    storeOperationalSettings,
    staff,
    setConfiguredBusinesses,
    setArchivedBusinessIds,
    setStoreChannelSettings,
    setStoreOperationalSettings: (value) => setStoreOperationalSettings(value as Record<string, StoreOperationalSettings>),
    setStaff,
  });

  const {
    syncError: runtimeSettingsSyncError,
    persistNow: persistRuntimeSettingsNow,
  } = useRuntimeSettingsFromApi({
    enabled: usesRuntimeSettingsApi(),
    auth: ownerSettingsApiAuth,
    loggedIn,
    isEmployee,
    lang,
    snapshot: runtimeSettingsSnapshot,
    onHydrate: applyRuntimeSettingsSnapshot as () => void,
  });

  const runtimeSettingsApiEnabled = usesRuntimeSettingsApi();

  const resolveStoreSalesChannels = useCallback((storeId: string) => {
    const channelConfig = resolveStoreChannelConfig(storeChannelSettings, storeId, defaultStoreChannelConfig);
    return channelConfig.channels
      .filter((channel) => channelConfig.activeIds.includes(String(channel.id)) && !channel.retired)
      .map((channel) => ({ ...channel, displayName: channelNameFn(channel, lang) }));
  }, [channelNameFn, defaultStoreChannelConfig, lang, storeChannelSettings]);

  useEffect(() => {
    if (
      typeof window !== "undefined"
      && isBrowserPersistentStorageAllowed({ scope: "ui-preferences" })
    ) {
      window.localStorage.setItem("taqfeelah_notebook_theme", notebookTheme);
    }
  }, [notebookTheme]);

  useEffect(() => {
    const businessIds = configuredBusinesses.map((business) => String(business.id));
    setStoreChannelSettings((current) => ensureStoreChannelSettingsForBusinesses(
      current,
      businessIds,
      defaultStoreChannelConfig,
      { allowPrototypeDefaults: !closeoutsApiDbSource && !orgConfigApiEnabled },
    ));
    setStoreOperationalSettings((current) => ensureStoreOperationalSettingsForBusinesses(
      current,
      businessIds,
    ) as Record<string, StoreOperationalSettings>);
  }, [closeoutsApiDbSource, configuredBusinesses, defaultStoreChannelConfig, orgConfigApiEnabled]);

  useEffect(() => {
    if (
      bindsToServerAuth
      || orgConfigApiEnabled
      || closeoutsApiDbSource
      || runtimeSettingsApiEnabled
      || typeof window === "undefined"
      || !isBrowserPersistentStorageAllowed({ scope: "operational-fallback" })
    ) return;
    window.localStorage.setItem(LAST_CLOSEOUT_STORAGE_KEY, JSON.stringify(lastCloseoutDates));
  }, [
    bindsToServerAuth,
    closeoutsApiDbSource,
    lastCloseoutDates,
    orgConfigApiEnabled,
    runtimeSettingsApiEnabled,
  ]);

  return {
    configuredBusinesses,
    setConfiguredBusinesses,
    archivedBusinessIds,
    setArchivedBusinessIds,
    staff,
    setStaff,
    ownerProfile,
    setOwnerProfile,
    storeChannelSettings,
    setStoreChannelSettings,
    storeOperationalSettings,
    setStoreOperationalSettings,
    notebookTheme,
    setNotebookTheme,
    employeePreferences,
    setEmployeePreferences,
    ownerShellPreferences,
    setOwnerShellPreferences,
    authOwnerUsername,
    setAuthOwnerUsername,
    authOwnerPassword,
    setAuthOwnerPassword,
    authEmployeePins,
    setAuthEmployeePins,
    lastCloseoutDates,
    setLastCloseoutDates,
    currentOwnerActor,
    ownerDisplayName,
    activeBusinesses,
    reportingBusinesses,
    closeoutAlertEnabledForBusiness,
    runtimeSettingsSnapshot,
    applyRuntimeSettingsSnapshot,
    persistRuntimeSettingsNow,
    runtimeSettingsSyncError,
    orgConfigSyncError,
    orgConfigLoading,
    orgConfigHydrated,
    reloadOrgConfig,
    flushOrgConfigPersist,
    resolveStoreSalesChannels,
  };
}
