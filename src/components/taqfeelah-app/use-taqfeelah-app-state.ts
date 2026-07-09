"use client";

import { useCallback, useMemo } from "react";
import { storeAttachmentPayload } from "@/features/attachments/client/attachment-payload-storage";
import { readDailyCloseouts } from "@/features/daily-closeouts/daily-closeouts-local-store";
import { readEmployeeNotebookTheme } from "@/features/employee-closeouts/employee-theme-storage";
import { appendStoreIdsToApiKey, usesRuntimeSettingsApi } from "@/core/config/runtime-capabilities";
import { useEmployeeEntryActions } from "@/features/employee-shell/client/use-employee-entry-actions";
import { useEmployeePortalState } from "@/features/employee-shell/client/use-employee-portal-state";
import { useOwnerSettingsState } from "@/features/org-config/client/use-owner-settings-state";
import { useOwnerShellState } from "@/features/owner-shell/client/use-owner-shell-state";
import { useRegisterOperationsState } from "@/features/operations/client/use-register-operations-state";
import { useRegisterSelectionState } from "@/features/operations/client/use-register-selection-state";
import { useTaqfeelahAppOperationalEntries } from "@/features/operations/client/use-taqfeelah-app-operational-entries";
import { useTaqfeelahAppCloseoutsApi } from "@/features/closeouts/client/use-taqfeelah-app-closeouts-api";
import {
  useTaqfeelahAppSessionState,
  useTaqfeelahAppSessionSync,
} from "@/features/auth/client/use-taqfeelah-app-session";
import { formatCalendarDate } from "@/features/reports/client/report-period-labels";
import { EMPTY_STORE_CHANNEL_CONFIG } from "@/features/org-config/client/store-channel-config";
import {
  DEFAULT_STORE_CHANNEL_CONFIG,
  channelName,
  expenseCategories,
  businesses,
  text,
} from "./taqfeelah-app-catalog-data";
import {
  BINDS_TO_SERVER_AUTH,
  ENTRIES_API_DB_SOURCE,
  REGISTER_ENTRIES_PAGINATION_ENABLED,
  CLOSEOUTS_API_DB_SOURCE,
  ORG_CONFIG_API_ENABLED,
  LOCAL_DEV_OWNER_USERNAME,
  LOCAL_DEV_OWNER_PASSWORD,
  migrateSavedSettings,
  readSavedSettings,
  DEFAULT_STAFF,
} from "./taqfeelah-app-boot";
import {
  entryIsActive,
  entryIsVoided,
} from "./taqfeelah-app-entry-helpers";
import { todayIsoDate } from "./taqfeelah-app-notebook";
import {
  buildEntry,
  defaultOwnerActor,
} from "./taqfeelah-app-operational-entry-helpers";
import { resolveOwnerActor } from "./resolve-owner-actor";
import { nextDayIso } from "./taqfeelah-app-date-helpers";
import { useTaqfeelahAppEmployeeThemeSync } from "./use-taqfeelah-app-employee-theme-sync";
import { useTaqfeelahOperationalSyncState } from "./use-taqfeelah-operational-sync-state";
import { useTaqfeelahAppOwnerSaveActions } from "./use-taqfeelah-app-owner-save-actions";
import { useTaqfeelahAppOwnerCloseoutActions } from "./use-taqfeelah-app-owner-closeout-actions";
import { useTaqfeelahAppRuntimeApiBundle } from "./use-taqfeelah-app-runtime-api-bundle";
import { useTaqfeelahSavingState } from "./use-taqfeelah-saving-state";
import { useTaqfeelahRuntimeApiContext } from "./use-taqfeelah-runtime-api-context";
import { useTaqfeelahAuthActions } from "./use-taqfeelah-auth-actions";
import { useTaqfeelahNotebookThemeEffect } from "./use-taqfeelah-notebook-theme-effect";
import type { CreateOperationalEntryInApiParams } from "@/features/operations/client/operations-client-types";
import type { NotebookThemeId } from "./taqfeelah-app-types";
import type { StoreRef } from "@/features/daily-closeouts/daily-closeouts-types";
import type { AuthStaffMember } from "@/features/auth/client/auth-client-types";
import type { OperationalEntry } from "@/features/entries/client/entries-client-types";
import type { PendingDuplicateSummary } from "@/features/operations/client/operations-client-types";
import type { StoreOperationalSettings } from "@/domain/store-operational-settings/types";

export function useTaqfeelahAppState() {
  const session = useTaqfeelahAppSessionState();
  const {
    runtimeAuthBoot,
    lang,
    setLang,
    sessionOrganizationId,
    setSessionOrganizationId,
    sessionUserId,
    setSessionUserId,
    loggedIn,
    setLoggedIn,
    authScreen,
    setAuthScreen,
    employee,
    setEmployee,
    loggedInEmployeeId,
    setLoggedInEmployeeId,
    employeeRuntimeReady,
    setEmployeeRuntimeReady,
    mustChangePassword,
    setMustChangePassword,
    sessionDisplayName,
    setSessionDisplayName,
  } = session;

  const { saving, setSaving, savingRef, saved, setSaved } = useTaqfeelahSavingState();
  const {
    notifyRef: operationalSyncNotifyRef,
    notifyOperationalSyncWrite,
  } = useTaqfeelahOperationalSyncState();

  const ownerSettings = useOwnerSettingsState({
    bindsToServerAuth: BINDS_TO_SERVER_AUTH,
    orgConfigApiEnabled: ORG_CONFIG_API_ENABLED,
    closeoutsApiDbSource: CLOSEOUTS_API_DB_SOURCE,
    sessionOrganizationId,
    sessionUserId,
    loggedIn,
    isEmployee: employee,
    lang,
    readSavedSettings,
    migrateSavedSettings,
    defaultBusinesses: businesses,
    defaultStaff: DEFAULT_STAFF,
    fallbackOwnerUsername: LOCAL_DEV_OWNER_USERNAME,
    fallbackOwnerPassword: LOCAL_DEV_OWNER_PASSWORD,
    defaultStoreChannelConfig: DEFAULT_STORE_CHANNEL_CONFIG,
    ownerActor: resolveOwnerActor(defaultOwnerActor),
    channelNameFn: channelName,
  });

  const {
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
    notebookPattern,
    setNotebookPattern,
    employeePreferences,
    setEmployeePreferences,
    ownerShellPreferences,
    setOwnerShellPreferences,
    setAuthOwnerUsername,
    setAuthOwnerPassword,
    setAuthEmployeePins,
    lastCloseoutDates,
    setLastCloseoutDates,
    currentOwnerActor,
    ownerDisplayName,
    activeBusinesses,
    reportingBusinesses,
    closeoutAlertEnabledForBusiness,
    persistRuntimeSettingsNow,
    runtimeSettingsSyncError,
    orgConfigSyncError,
    orgConfigLoading,
    orgConfigHydrated,
    resolveStoreSalesChannels,
  } = ownerSettings;

  const ownerOrgConfigReady = useMemo(
    () => !ORG_CONFIG_API_ENABLED
      || employee
      || (orgConfigHydrated && !orgConfigLoading && activeBusinesses.length > 0),
    [activeBusinesses.length, employee, orgConfigHydrated, orgConfigLoading],
  );

  const employeePortal = useEmployeePortalState({
    employee,
    loggedInEmployeeId: loggedInEmployeeId ?? undefined,
    staff: staff as AuthStaffMember[],
    sessionUserId: sessionUserId ?? undefined,
    activeBusinesses: activeBusinesses as StoreRef[],
    storeChannelSettings,
    defaultStoreChannelConfig: ORG_CONFIG_API_ENABLED
      ? EMPTY_STORE_CHANNEL_CONFIG
      : DEFAULT_STORE_CHANNEL_CONFIG,
    storeOperationalSettings: storeOperationalSettings as Record<string, StoreOperationalSettings>,
    notebookTheme,
    expenseCategories,
    lastCloseoutDates: lastCloseoutDates as Record<string, string>,
    todayDate: todayIsoDate(),
    nextDay: nextDayIso,
    initialEmployeeBusinessId: runtimeAuthBoot.employeeBusinessId,
    initialEmployeeThemeOverride: runtimeAuthBoot.employee && runtimeAuthBoot.loggedInEmployeeId && !usesRuntimeSettingsApi()
      ? readEmployeeNotebookTheme(String(runtimeAuthBoot.loggedInEmployeeId))
      : null,
  });

  const {
    setEmployeePage,
    employeeBusinessId,
    setEmployeeBusinessId,
    employeeThemeOverride,
    setEmployeeThemeOverride,
    activeEmployee,
    assignedEmployeeBusinesses,
    currentEmployeeChannelConfig,
    employeeNotebookTheme,
    assignedEmployeeBusinessIds,
  } = employeePortal;

  const { employeePreferencesSyncError, handleEmployeeNotebookThemeSave } = useTaqfeelahAppEmployeeThemeSync({
    employee,
    loggedIn,
    employeeRuntimeReady,
    lang,
    sessionUserId,
    activeEmployee,
    employeePreferences: employeePreferences as Record<string, { notebookTheme?: NotebookThemeId | string }>,
    setEmployeePreferences: setEmployeePreferences as import("./taqfeelah-app-types").AppSetState<Record<string, { notebookTheme?: NotebookThemeId | string }>>,
    employeeThemeOverride: employeeThemeOverride ?? notebookTheme,
    setEmployeeThemeOverride: setEmployeeThemeOverride as import("@/features/entries/client/entries-client-types").SetState<string | null>,
  });

  const runtimeApiContext = useTaqfeelahRuntimeApiContext({
    bindsToServerAuth: BINDS_TO_SERVER_AUTH,
    orgConfigApiEnabled: ORG_CONFIG_API_ENABLED,
    employee,
    loggedIn,
    employeeRuntimeReady,
    sessionOrganizationId,
    sessionUserId,
    activeEmployee,
    assignedEmployeeBusinesses,
    activeBusinesses,
    ownerOrgConfigReady,
  });

  const {
    closeoutsApiEnabled,
    closeoutsApiStrictMode,
    entriesApiEnabled,
    entriesApiStrictMode,
    phase9ApiEnabled,
    closeoutsApiOrganizationId,
    ownerApiUserId,
    apiActorRole,
    apiActorUserId,
    apiTargetStoreIdsKey,
    runtimeApiStoresReady,
    runtimeApiAuth,
    ownerNotebookApiEnabled,
    operationalSyncEnabled,
  } = runtimeApiContext;

  const registerSelection = useRegisterSelectionState({
    archivedBusinessIds: archivedBusinessIds as never,
  });

  const {
    setSelected,
    voidTarget,
    setVoidTarget,
    restoreTarget,
    setRestoreTarget,
    setSavedOutflowShareTarget,
    pendingDuplicateSummary,
    setPendingDuplicateSummary,
  } = registerSelection;

  const operational = useTaqfeelahAppOperationalEntries({
    lang,
    loggedIn,
    runtimeApiStoresReady,
    employee,
    entriesApiEnabled,
    entriesApiStrictMode,
    closeoutsApiOrganizationId,
    apiActorUserId,
    apiActorRole,
    apiTargetStoreIdsKey,
    phase9ApiEnabled,
    setLastCloseoutDates: setLastCloseoutDates as import("@/features/entries/client/entries-client-types").SetState<Record<string, string>>,
  });

  const {
    operationalEntries,
    setOperationalEntries,
    createOperationalEntryInApi,
    loadOperationalEntriesFromApi,
    syncCloseoutToOperationalEntries,
    removeOperationalEntriesForCloseout,
  } = operational;

  const createOperationalEntryInApiWithSync = useCallback(async (args: CreateOperationalEntryInApiParams) => {
    const created = await createOperationalEntryInApi(args);
    if (created) {
      notifyOperationalSyncWrite("entry.created");
    }
    return created;
  }, [createOperationalEntryInApi, notifyOperationalSyncWrite]);

  const ownerShell = useOwnerShellState({
    bindsToServerAuth: BINDS_TO_SERVER_AUTH,
    ownerShellPreferences,
    onOwnerShellPreferencesChange: setOwnerShellPreferences as (value: Record<string, unknown>) => void,
    operationalEntries,
    activeBusinesses: activeBusinesses as import("@/features/auth/client/auth-client-types").AuthActiveBusiness[],
    configuredBusinesses: configuredBusinesses as import("@/features/auth/client/auth-client-types").AuthActiveBusiness[],
    storeOperationalSettings: storeOperationalSettings as Record<string, StoreOperationalSettings>,
    closeoutAlertEnabledForBusiness: closeoutAlertEnabledForBusiness as (businessId: string | undefined) => boolean,
    setSelected: registerSelection.setSelected as (value: OperationalEntry | null) => void,
  });

  const {
    ownerPage,
    setOwnerPage,
    setSelectedBusiness,
    setArchivedReadOnlyBusinessId,
    setQuickAddOpen,
    helpOpen,
    setHelpOpen,
    ownerManageCloseout,
    setOwnerManageCloseout,
    setCloseoutAlerts,
    setDuplicateSummaryFocus,
    setShareSnapshot,
    setAcknowledgedDuplicateSales,
    activeViewBusiness,
    activeOwnerStoreId,
    archivedReadOnlyBusinessId,
    pushCloseoutAlert,
    openQuickAddSummary,
    openQuickAddExpense,
  } = ownerShell;

  const syncApiTargetStoreIdsKey = useMemo(
    () => appendStoreIdsToApiKey(
      apiTargetStoreIdsKey,
      archivedReadOnlyBusinessId ? [archivedReadOnlyBusinessId] : [],
    ),
    [apiTargetStoreIdsKey, archivedReadOnlyBusinessId],
  );

  useTaqfeelahAppSessionSync({
    loggedIn,
    employee,
    sessionOrganizationId,
    sessionUserId,
    loggedInEmployeeId,
    setSessionOrganizationId,
    setSessionUserId,
    setLoggedIn,
    setAuthScreen,
    setEmployee,
    setLoggedInEmployeeId,
    setEmployeeRuntimeReady,
    setOwnerPage,
    setEmployeePage,
    staff,
    setStaff,
    setConfiguredBusinesses,
    setArchivedBusinessIds,
    setStoreChannelSettings,
    setStoreOperationalSettings: setStoreOperationalSettings as (value: Record<string, unknown>) => void,
    setOwnerProfile,
    setMustChangePassword,
    setSessionDisplayName,
    employeeBusinessId,
    setEmployeeBusinessId,
    closeoutsApiEnabled,
    entriesApiEnabled,
    configuredBusinesses,
    storeChannelSettings,
  });

  const authHandlers = useTaqfeelahAuthActions({
    staff: staff as import("@/features/auth/client/auth-client-types").AuthStaffMember[],
    setStaff,
    activeBusinesses: activeBusinesses as import("@/features/auth/client/auth-client-types").AuthActiveBusiness[],
    setSessionOrganizationId,
    setSessionUserId,
    setLoggedIn,
    setEmployee,
    setLoggedInEmployeeId,
    setAuthScreen,
    setEmployeeBusinessId,
    setEmployeeThemeOverride,
    setEmployeePage,
    setOwnerPage,
    setOwnerManageCloseout,
    setSelected,
    setVoidTarget,
    setRestoreTarget,
    setSavedOutflowShareTarget,
    setPendingDuplicateSummary,
    setDuplicateSummaryFocus,
    setShareSnapshot,
    setQuickAddOpen,
    setArchivedReadOnlyBusinessId,
    setSelectedBusiness,
    setOperationalEntries,
    setConfiguredBusinesses,
    setArchivedBusinessIds,
    setAuthOwnerUsername,
    setAuthOwnerPassword,
    setAuthEmployeePins,
    setOwnerProfile,
    setMustChangePassword,
    setSessionDisplayName,
  } as import("@/features/auth/client/taqfeelah-app-auth-handlers").TaqfeelahAppAuthHandlerDeps);

  const {
    completeOwnerLogin,
    completeEmployeeLogin,
    logout,
  } = authHandlers;

  const ownerCloseout = useTaqfeelahAppOwnerCloseoutActions({
    lang,
    entriesApiDbSource: ENTRIES_API_DB_SOURCE,
    runtimeApiStoresReady,
    activeViewBusiness,
    activeBusinesses: activeBusinesses as import("./taqfeelah-app-types").AppBusiness[],
    activeOwnerStoreId: activeOwnerStoreId || "",
    storeChannelSettings,
    ownerApiUserId,
    currentOwnerActor: currentOwnerActor as import("./taqfeelah-app-types").AppOwnerActor,
    ownerProfile,
    ownerDisplayName,
    setOwnerPage,
    setQuickAddOpen,
    openQuickAddSummary,
    openQuickAddExpense,
    loadOperationalEntriesFromApi,
    removeOperationalEntriesForCloseout,
    syncCloseoutToOperationalEntries,
    setCloseoutAlerts: setCloseoutAlerts as import("./taqfeelah-app-types").AppSetState<Array<Record<string, unknown>>>,
    setOwnerManageCloseout,
  });

  const activeBusinessIds = activeBusinesses.map((business) => business.id);
  const todayDate = todayIsoDate();

  useTaqfeelahNotebookThemeEffect({ employee, employeeNotebookTheme, notebookTheme });

  const closeoutsApi = useTaqfeelahAppCloseoutsApi({
    lang,
    closeoutsApiEnabled,
    closeoutsApiStrictMode,
    closeoutsApiOrganizationId,
    apiActorUserId,
    apiActorRole,
    apiTargetStoreIdsKey: syncApiTargetStoreIdsKey,
    employee,
    storeOperationalSettings,
    loadOperationalEntriesFromApi,
    currentEmployeeChannelConfig,
    resolveStoreSalesChannels,
    notifyOperationalSyncWrite,
  });

  const { saveOwner, saveOwnerSummary } = useTaqfeelahAppOwnerSaveActions({
    lang,
    savingRef,
    setSaving,
    entriesApiDbSource: ENTRIES_API_DB_SOURCE,
    entriesApiEnabled,
    activeBusinessIds: activeBusinessIds as string[],
    todayDate,
    createOperationalEntryInApi: createOperationalEntryInApiWithSync,
    loadOperationalEntriesFromApi,
    ownerApiUserId,
    currentOwnerActor: currentOwnerActor as import("./taqfeelah-app-types").AppOwnerActor,
    setLastCloseoutDates,
    setOwnerPage,
    setSavedOutflowShareTarget: setSavedOutflowShareTarget as (entry: OperationalEntry | null) => void,
    setSaved,
    setOperationalEntries,
    closeoutsApiEnabled,
    closeoutsApiOrganizationId,
    ownerCloseoutChannelConfig: ownerCloseout.ownerCloseoutChannelConfig,
    syncSubmitCloseoutToApi: closeoutsApi.syncSubmitCloseoutToApi as (params: Record<string, unknown>) => Promise<Record<string, unknown> | null>,
  });

  const { persistEmployeeEntry } = useEmployeeEntryActions({
    lang,
    text,
    savingRef,
    setSaving,
    activeEmployee,
    assignedEmployeeBusinessIds,
    entriesApiEnabled,
    entriesApiDbSource: ENTRIES_API_DB_SOURCE,
    createOperationalEntryInApi: createOperationalEntryInApiWithSync as (args: {
      payload: import("@/features/entries/client/entries-client-types").OperationalEntryPayload;
      actorUserId: string;
      actorRole: string;
    }) => Promise<OperationalEntry | null>,
    loadOperationalEntriesFromApi,
    buildEntry,
    storeAttachmentPayload,
    setOperationalEntries,
    setLastCloseoutDates: setLastCloseoutDates as import("@/features/entries/client/entries-client-types").SetState<Record<string, string>>,
    setCloseoutAlerts,
    closeoutAlertEnabledForBusiness: closeoutAlertEnabledForBusiness as (businessId: string | undefined) => boolean,
    setEmployeePage,
    setSaved,
    operationalEntries,
    entryIsActive,
    todayDate,
  } as import("@/features/employee-shell/client/employee-shell-client-types").UseEmployeeEntryActionsProps);

  const registerOperations = useRegisterOperationsState({
    lang,
    setSelected: setSelected as (value: OperationalEntry | null) => void,
    voidTarget: voidTarget as OperationalEntry | null,
    setVoidTarget: setVoidTarget as (value: OperationalEntry | null) => void,
    restoreTarget: restoreTarget as OperationalEntry | null,
    setRestoreTarget: setRestoreTarget as (value: OperationalEntry | null) => void,
    pendingDuplicateSummary: pendingDuplicateSummary as PendingDuplicateSummary,
    setPendingDuplicateSummary: setPendingDuplicateSummary as (value: PendingDuplicateSummary) => void,
    operationalEntries,
    archivedBusinessIds,
    entriesApiEnabled,
    phase9ApiEnabled,
    entriesApiDbSource: ENTRIES_API_DB_SOURCE,
    closeoutsApiOrganizationId,
    ownerApiUserId,
    currentOwnerActor: currentOwnerActor as import("./taqfeelah-app-types").AppOwnerActor,
    activeEmployee,
    entryIsActive,
    entryIsVoided,
    bindsToServerAuth: BINDS_TO_SERVER_AUTH,
    closeoutsApiDbSource: CLOSEOUTS_API_DB_SOURCE,
    readDailyCloseouts: readDailyCloseouts as () => import("@/features/operations/client/operations-client-types").CloseoutRecord[],
    loadOperationalEntriesFromApi,
    setOperationalEntries,
    setLastCloseoutDates: setLastCloseoutDates as import("@/features/entries/client/entries-client-types").SetState<Record<string, string>>,
    setAcknowledgedDuplicateSales,
    setOwnerPage,
    setEmployeePage,
    setSaved,
    setOwnerManageCloseout,
    pushCloseoutAlert,
    saveOwner,
    persistEmployeeEntry,
    savingRef,
    setSaving,
    notifyOperationalSyncWrite,
  });

  const apiBundle = useTaqfeelahAppRuntimeApiBundle({
    closeoutsApiDbSource: CLOSEOUTS_API_DB_SOURCE,
    closeoutsApiEnabled,
    entriesApiDbSource: ENTRIES_API_DB_SOURCE,
    entriesApiEnabled,
    runtimeApiStoresReady,
    apiTargetStoreIdsKey: syncApiTargetStoreIdsKey,
    employee,
    storeOperationalSettings,
    ownerPage,
    ownerManageCloseout,
    closeoutsApiOrganizationId,
    apiActorUserId,
    apiActorRole,
    ownerApiUserId,
    employeePreferencesSyncError,
    runtimeSettingsSyncError,
    orgConfigSyncError,
  });

  return {
    lang,
    setLang,
    loggedIn,
    mustChangePassword,
    setMustChangePassword,
    authScreen,
    setAuthScreen,
    employee,
    employeeRuntimeReady,
    sessionDisplayName,
    saving,
    saved,
    ownerOrgConfigReady,
    orgConfigSyncError,
    activeBusinesses,
    ownerSettings,
    employeePortal,
    ownerShell,
    ownerCloseout,
    registerSelection,
    operational,
    registerOperations,
    closeoutsApi,
    apiBundle,
    runtimeApiStoresReady,
    runtimeApiAuth,
    auth: {
      completeOwnerLogin,
      completeEmployeeLogin,
      logout,
    },
    saveOwner,
    saveOwnerSummary,
    handleEmployeeNotebookThemeSave,
    helpOpen,
    setHelpOpen,
    ENTRIES_API_DB_SOURCE,
    REGISTER_ENTRIES_PAGINATION_ENABLED,
    CLOSEOUTS_API_DB_SOURCE,
    ORG_CONFIG_API_ENABLED,
    entriesApiEnabled,
    phase9ApiEnabled,
    closeoutsApiEnabled,
    closeoutsApiStrictMode,
    closeoutsApiOrganizationId,
    ownerApiUserId,
    ownerNotebookApiEnabled,
    reportingBusinesses,
    archivedBusinessIds,
    notebookTheme,
    notebookPattern,
    setNotebookTheme,
    setNotebookPattern,
    employeePreferences,
    ownerShellPreferences,
    persistRuntimeSettingsNow,
    resolveStoreSalesChannels,
    channelName,
    text,
    formatCalendarDate,
    operationalSync: {
      enabled: operationalSyncEnabled,
      organizationId: closeoutsApiOrganizationId,
      actorUserId: apiActorUserId,
      actorRole: apiActorRole,
      closeoutsSyncEnabled: closeoutsApiEnabled,
      entriesSyncEnabled: entriesApiEnabled,
      notifyRef: operationalSyncNotifyRef,
    },
  };
}
