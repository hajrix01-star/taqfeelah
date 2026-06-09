"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isBrowserPersistentStorageAllowed } from "@/core/config/browser-persistence-policy";
import { autoResolveSubmittedCloseoutsWithoutReview } from "@/features/daily-closeouts/daily-closeouts-demo-store";
import { isValidNotebookTheme } from "@/features/daily-closeouts/notebook-themes";
import { useOrgConfigRuntimeBridge } from "./org-config-runtime-bridge.js";
import {
  applyRuntimeSettingsSnapshotPatch,
  buildRuntimeSettingsSnapshot,
  resolveOwnerSettingsApiAuth,
  usesRuntimeSettingsApi,
} from "@/features/runtime-settings/client/runtime-settings-bridge.js";
import { useRuntimeSettingsFromApi } from "@/features/runtime-settings/client/use-runtime-settings-from-api.js";
import {
  buildInitialStoreOperationalSettings,
  buildStoreOperationalPolicy,
  ensureStoreOperationalSettingsForBusinesses,
  getStoreOperationalConfig,
} from "./store-operational-config.js";
import {
  buildInitialStoreChannelSettings,
  ensureStoreChannelSettingsForBusinesses,
  resolveStoreChannelConfig,
} from "./store-channel-config.js";
import { LAST_CLOSEOUT_STORAGE_KEY, readDemoLastCloseoutDates } from "./owner-settings-storage.js";

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
}) {
  const initialSettings = readSavedSettings();
  const initialAuthConfig = initialSettings?.authConfig || {};
  const initialBusinesses = initialSettings?.configuredBusinesses || (bindsToServerAuth ? [] : defaultBusinesses);

  const [configuredBusinesses, setConfiguredBusinesses] = useState(initialBusinesses);
  const [archivedBusinessIds, setArchivedBusinessIds] = useState(
    initialSettings?.archivedBusinessIds || initialSettings?.archivedStores || [],
  );
  const [staff, setStaff] = useState(initialSettings?.staff || (bindsToServerAuth ? [] : defaultStaff));
  const [ownerProfile, setOwnerProfile] = useState(initialSettings?.ownerProfile || { name: "محمد الهاجري" });
  const [storeChannelSettings, setStoreChannelSettings] = useState(
    () => buildInitialStoreChannelSettings(initialSettings, initialBusinesses, defaultStoreChannelConfig),
  );
  const [storeOperationalSettings, setStoreOperationalSettings] = useState(
    () => buildInitialStoreOperationalSettings(initialSettings, initialBusinesses),
  );
  const [notebookTheme, setNotebookTheme] = useState(() => {
    if (isValidNotebookTheme(initialSettings?.notebookTheme)) return initialSettings.notebookTheme;
    if (!isBrowserPersistentStorageAllowed({ scope: "ui-preferences" })) return "yellow";
    if (typeof window === "undefined") return "yellow";
    return window.localStorage.getItem("taqfeelah_notebook_theme") || "yellow";
  });
  const [employeePreferences, setEmployeePreferences] = useState(
    () => (initialSettings?.employeePreferences && typeof initialSettings.employeePreferences === "object"
      ? initialSettings.employeePreferences
      : {}),
  );
  const [ownerShellPreferences, setOwnerShellPreferences] = useState(
    () => (initialSettings?.ownerShellPreferences && typeof initialSettings.ownerShellPreferences === "object"
      ? initialSettings.ownerShellPreferences
      : {}),
  );
  const [authOwnerUsername, setAuthOwnerUsername] = useState(
    () => initialAuthConfig.ownerUsername || prototypeOwnerUsername || "hajri",
  );
  const [authOwnerPassword, setAuthOwnerPassword] = useState(
    () => initialAuthConfig.ownerPassword || prototypeOwnerPassword || "123",
  );
  const [authEmployeePins, setAuthEmployeePins] = useState(
    () => (initialAuthConfig.employeePins && typeof initialAuthConfig.employeePins === "object"
      ? initialAuthConfig.employeePins
      : {}),
  );
  const [lastCloseoutDates, setLastCloseoutDates] = useState(() => readDemoLastCloseoutDates(bindsToServerAuth));

  const currentOwnerActor = useMemo(
    () => ({ ...ownerActor, nameAr: ownerProfile.name, nameEn: ownerProfile.name }),
    [ownerActor, ownerProfile.name],
  );
  const ownerDisplayName = ownerProfile?.name || (lang === "ar" ? "المالك" : "Owner");

  const activeBusinesses = useMemo(
    () => configuredBusinesses.filter((business) => !archivedBusinessIds.includes(business.id)),
    [archivedBusinessIds, configuredBusinesses],
  );
  const reportingBusinesses = configuredBusinesses;

  const {
    reviewEnabledForBusiness,
    closeoutReviewEnabledForBusiness,
    attachmentAlertEnabledForBusiness,
    closeoutAlertEnabledForBusiness,
  } = useMemo(
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

  const applyRuntimeSettingsSnapshot = useCallback((rawSettings) => {
    applyRuntimeSettingsSnapshotPatch({
      migrated: migrateSavedSettings(rawSettings),
      orgConfigApiEnabled,
      apply: {
        setConfiguredBusinesses,
        setArchivedBusinessIds,
        setStoreChannelSettings,
        setStaff,
        setStoreOperationalSettings,
        setNotebookTheme,
        setEmployeePreferences,
        setOwnerShellPreferences,
        setOwnerProfile,
        setAuthOwnerUsername,
        setAuthOwnerPassword,
        setAuthEmployeePins,
      },
    });
  }, [migrateSavedSettings, orgConfigApiEnabled]);

  const ownerSettingsApiAuth = resolveOwnerSettingsApiAuth({
    sessionOrganizationId,
    sessionUserId,
    actorRole: isEmployee ? "employee" : "owner",
  });

  const { error: orgConfigSyncError } = useOrgConfigRuntimeBridge({
    enabled: orgConfigApiEnabled && usesRuntimeSettingsApi(),
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
    setStoreOperationalSettings,
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
    onHydrate: applyRuntimeSettingsSnapshot,
  });

  const resolveStoreSalesChannels = useCallback((storeId) => {
    const channelConfig = resolveStoreChannelConfig(storeChannelSettings, storeId, defaultStoreChannelConfig);
    return channelConfig.channels
      .filter((channel) => channelConfig.activeIds.includes(channel.id) && !channel.retired)
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
    const businessIds = configuredBusinesses.map((business) => business.id);
    setStoreChannelSettings((current) => ensureStoreChannelSettingsForBusinesses(
      current,
      businessIds,
      defaultStoreChannelConfig,
    ));
    setStoreOperationalSettings((current) => ensureStoreOperationalSettingsForBusinesses(current, businessIds));
  }, [configuredBusinesses, defaultStoreChannelConfig]);

  useEffect(() => {
    if (bindsToServerAuth || closeoutsApiDbSource) return;
    autoResolveSubmittedCloseoutsWithoutReview(
      (storeId) => Boolean(getStoreOperationalConfig(storeOperationalSettings, storeId).closeoutReviewEnabled),
    );
  }, [bindsToServerAuth, closeoutsApiDbSource, storeOperationalSettings]);

  useEffect(() => {
    if (
      bindsToServerAuth
      || typeof window === "undefined"
      || !isBrowserPersistentStorageAllowed({ scope: "operational-fallback" })
    ) return;
    window.localStorage.setItem(LAST_CLOSEOUT_STORAGE_KEY, JSON.stringify(lastCloseoutDates));
  }, [bindsToServerAuth, lastCloseoutDates]);

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
    reviewEnabledForBusiness,
    closeoutReviewEnabledForBusiness,
    attachmentAlertEnabledForBusiness,
    closeoutAlertEnabledForBusiness,
    runtimeSettingsSnapshot,
    applyRuntimeSettingsSnapshot,
    persistRuntimeSettingsNow,
    runtimeSettingsSyncError,
    orgConfigSyncError,
    resolveStoreSalesChannels,
  };
}
