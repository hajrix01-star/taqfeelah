"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { storeAttachmentPayload } from "@/features/attachments/client/prototype-attachment-storage";
import { readDailyCloseouts } from "@/features/daily-closeouts/daily-closeouts-demo-store";
import { applyNotebookThemeCssVariables } from "@/features/daily-closeouts/notebook-themes";
import { readEmployeeNotebookTheme } from "@/features/employee-closeouts/employee-theme-storage";
import { isUuid } from "@/core/client/api-id-utils";
import { resolveRuntimeApiActorContext, appendStoreIdsToApiKey, usesRuntimeSettingsApi } from "@/core/config/runtime-capabilities";
import { useEmployeeEntryActions } from "@/features/employee-shell/client/use-employee-entry-actions";
import { useEmployeePortalState } from "@/features/employee-shell/client/use-employee-portal-state";
import { useOwnerSettingsState } from "@/features/org-config/client/use-owner-settings-state";
import { useOwnerShellState } from "@/features/owner-shell/client/use-owner-shell-state";
import { useRegisterOperationsState } from "@/features/operations/client/use-register-operations-state";
import { useRegisterSelectionState } from "@/features/operations/client/use-register-selection-state";
import { usePrototypeRuntimeOperationalEntries } from "@/features/operations/client/use-prototype-runtime-operational-entries";
import { usePrototypeRuntimeCloseoutsApi } from "@/features/closeouts/client/use-prototype-runtime-closeouts-api";
import {
  usePrototypeRuntimeSessionState,
  usePrototypeRuntimeSessionSync,
} from "@/features/auth/client/use-prototype-runtime-session";
import { createPrototypeRuntimeAuthHandlers } from "@/features/auth/client/prototype-runtime-auth-handlers";
import { formatCalendarDate } from "@/features/reports/client/report-period-labels";
import { resolveOwnerSettingsApiAuth } from "@/features/runtime-settings/client/runtime-settings-bridge";
import { EMPTY_STORE_CHANNEL_CONFIG } from "@/features/org-config/client/store-channel-config";
import {
  DEFAULT_STORE_CHANNEL_CONFIG,
  channelName,
  expenseCategories,
  businesses,
  text,
} from "./prototype-runtime-demo-data";
import {
  BINDS_TO_SERVER_AUTH,
  ENTRIES_API_DB_SOURCE,
  REGISTER_ENTRIES_PAGINATION_ENABLED,
  CLOSEOUTS_API_DB_SOURCE,
  ORG_CONFIG_API_ENABLED,
  PROTOTYPE_OWNER_USERNAME,
  PROTOTYPE_OWNER_PASSWORD,
  migrateSavedSettings,
  readSavedSettings,
  PROTOTYPE_DEFAULT_STAFF,
} from "./prototype-runtime-boot";
import {
  entryIsActive,
  entryIsVoided,
} from "./prototype-runtime-entry-helpers";
import { todayIsoDate } from "./prototype-runtime-notebook";
import {
  buildEntry,
  prototypeOwnerActor,
} from "./prototype-runtime-demo-operational-entries";
import { resolvePrototypeOwnerActor } from "./resolve-prototype-owner-actor";
import { nextDayIso } from "./prototype-runtime-date-helpers";
import { usePrototypeRuntimeEmployeeThemeSync } from "./use-prototype-runtime-employee-theme-sync";
import { usePrototypeRuntimeOwnerSaveActions } from "./use-prototype-runtime-owner-save-actions";
import { usePrototypeRuntimeOwnerCloseoutActions } from "./use-prototype-runtime-owner-closeout-actions";
import { usePrototypeRuntimeRuntimeApiBundle } from "./use-prototype-runtime-runtime-api-bundle";
import type { NotifyOperationalSyncWriteFn } from "@/features/operations/client/operations-client-types";
import type { OperationalSyncEventType } from "@/core/sync/operational-sync-event-types";
import type { CreateOperationalEntryInApiParams } from "@/features/operations/client/operations-client-types";
import type { NotebookThemeId } from "./prototype-runtime-types";
import type { StoreRef } from "@/features/daily-closeouts/daily-closeouts-types";
import type { AuthStaffMember } from "@/features/auth/client/auth-client-types";
import type { OperationalEntry } from "@/features/entries/client/entries-client-types";
import type { PendingDuplicateSummary } from "@/features/operations/client/operations-client-types";
import type { StoreOperationalSettings } from "@/domain/store-operational-settings/types";

export function usePrototypeRuntimeAppState() {
  const session = usePrototypeRuntimeSessionState();
  const {
    prototypeAuthBoot,
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

  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [saved, setSaved] = useState(false);
  const operationalSyncNotifyRef = useRef<NotifyOperationalSyncWriteFn | null>(null);
  const notifyOperationalSyncWrite = useCallback((eventType: OperationalSyncEventType | string) => {
    operationalSyncNotifyRef.current?.(eventType);
  }, []);

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
    defaultStaff: PROTOTYPE_DEFAULT_STAFF,
    prototypeOwnerUsername: PROTOTYPE_OWNER_USERNAME,
    prototypeOwnerPassword: PROTOTYPE_OWNER_PASSWORD,
    defaultStoreChannelConfig: DEFAULT_STORE_CHANNEL_CONFIG,
    ownerActor: resolvePrototypeOwnerActor(prototypeOwnerActor),
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
    initialEmployeeBusinessId: prototypeAuthBoot.employeeBusinessId,
    initialEmployeeThemeOverride: prototypeAuthBoot.employee && prototypeAuthBoot.loggedInEmployeeId && !usesRuntimeSettingsApi()
      ? readEmployeeNotebookTheme(String(prototypeAuthBoot.loggedInEmployeeId))
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

  const { employeePreferencesSyncError, handleEmployeeNotebookThemeSave } = usePrototypeRuntimeEmployeeThemeSync({
    employee,
    loggedIn,
    employeeRuntimeReady,
    lang,
    sessionUserId,
    activeEmployee,
    employeePreferences: employeePreferences as Record<string, { notebookTheme?: NotebookThemeId | string }>,
    setEmployeePreferences: setEmployeePreferences as import("./prototype-runtime-types").PrototypeSetState<Record<string, { notebookTheme?: NotebookThemeId | string }>>,
    employeeThemeOverride: employeeThemeOverride ?? notebookTheme,
    setEmployeeThemeOverride: setEmployeeThemeOverride as import("@/features/entries/client/entries-client-types").SetState<string | null>,
  });

  const {
    closeoutsApiEnabled,
    closeoutsApiStrictMode,
    entriesApiEnabled,
    entriesApiStrictMode,
    phase9ApiEnabled,
    organizationId: closeoutsApiOrganizationId,
    ownerApiUserId,
    apiActorRole,
    apiActorUserId,
    apiTargetStoreIdsKey,
  } = resolveRuntimeApiActorContext({
    employee,
    sessionOrganizationId,
    sessionUserId,
    activeEmployee,
    assignedEmployeeBusinesses,
    operationalBusinesses: activeBusinesses,
  });

  const runtimeApiStoresReady = useMemo(
    () => {
      if (!ORG_CONFIG_API_ENABLED) return true;
      if (employee) {
        return employeeRuntimeReady && Boolean(apiTargetStoreIdsKey);
      }
      return ownerOrgConfigReady && Boolean(apiTargetStoreIdsKey);
    },
    [apiTargetStoreIdsKey, employee, employeeRuntimeReady, ownerOrgConfigReady],
  );

  const runtimeApiAuth = useMemo(
    () => resolveOwnerSettingsApiAuth({
      sessionOrganizationId,
      sessionUserId,
      actorRole: employee ? "employee" : "owner",
    }),
    [employee, sessionOrganizationId, sessionUserId],
  );

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

  const operational = usePrototypeRuntimeOperationalEntries({
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

  usePrototypeRuntimeSessionSync({
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

  const authHandlers = useMemo(
    () => createPrototypeRuntimeAuthHandlers({
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
    } as import("@/features/auth/client/prototype-runtime-auth-handlers").PrototypeRuntimeAuthHandlerDeps),
    [
      activeBusinesses,
      setArchivedBusinessIds,
      setArchivedReadOnlyBusinessId,
      setAuthEmployeePins,
      setAuthOwnerPassword,
      setAuthOwnerUsername,
      setAuthScreen,
      setConfiguredBusinesses,
      setDuplicateSummaryFocus,
      setEmployee,
      setEmployeeBusinessId,
      setEmployeePage,
      setEmployeeThemeOverride,
      setLoggedIn,
      setLoggedInEmployeeId,
      setOperationalEntries,
      setOwnerPage,
      setOwnerProfile,
      setMustChangePassword,
      setSessionDisplayName,
      setOwnerManageCloseout,
      setPendingDuplicateSummary,
      setQuickAddOpen,
      setSavedOutflowShareTarget,
      setSelected,
      setSelectedBusiness,
      setSessionOrganizationId,
      setSessionUserId,
      setShareSnapshot,
      setStaff,
      setVoidTarget,
      setRestoreTarget,
      staff,
    ],
  );

  const {
    completeOwnerLogin,
    completeEmployeeLogin,
    logout,
  } = authHandlers;

  const ownerCloseout = usePrototypeRuntimeOwnerCloseoutActions({
    lang,
    entriesApiDbSource: ENTRIES_API_DB_SOURCE,
    runtimeApiStoresReady,
    activeViewBusiness,
    activeBusinesses: activeBusinesses as import("./prototype-runtime-types").PrototypeBusiness[],
    activeOwnerStoreId: activeOwnerStoreId || "",
    storeChannelSettings,
    ownerApiUserId,
    currentOwnerActor: currentOwnerActor as import("./prototype-runtime-types").PrototypeOwnerActor,
    ownerProfile,
    ownerDisplayName,
    setOwnerPage,
    setQuickAddOpen,
    openQuickAddSummary,
    openQuickAddExpense,
    loadOperationalEntriesFromApi,
    removeOperationalEntriesForCloseout,
    syncCloseoutToOperationalEntries,
    setCloseoutAlerts: setCloseoutAlerts as import("./prototype-runtime-types").PrototypeSetState<Array<Record<string, unknown>>>,
    setOwnerManageCloseout,
  });

  const activeBusinessIds = activeBusinesses.map((business) => business.id);
  const todayDate = todayIsoDate();

  useEffect(() => {
    applyNotebookThemeCssVariables(employee ? employeeNotebookTheme : notebookTheme);
  }, [employee, employeeNotebookTheme, notebookTheme]);

  const closeoutsApi = usePrototypeRuntimeCloseoutsApi({
    lang,
    closeoutsApiEnabled,
    closeoutsApiStrictMode,
    closeoutsApiOrganizationId,
    apiActorUserId,
    apiActorRole,
    apiTargetStoreIdsKey: syncApiTargetStoreIdsKey,
    employee,
    storeOperationalSettings,
    entriesApiEnabled,
    loadOperationalEntriesFromApi,
    currentEmployeeChannelConfig,
    ownerCloseoutBusiness: ownerCloseout.ownerCloseoutBusiness,
    ownerCloseoutChannelConfig: ownerCloseout.ownerCloseoutChannelConfig,
    notifyOperationalSyncWrite,
  });

  const { saveOwner, saveOwnerSummary } = usePrototypeRuntimeOwnerSaveActions({
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
    currentOwnerActor: currentOwnerActor as import("./prototype-runtime-types").PrototypeOwnerActor,
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
    currentOwnerActor: currentOwnerActor as import("./prototype-runtime-types").PrototypeOwnerActor,
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

  const ownerNotebookApiEnabled = useMemo(
    () => BINDS_TO_SERVER_AUTH
      && isUuid(closeoutsApiOrganizationId)
      && isUuid(ownerApiUserId),
    [closeoutsApiOrganizationId, ownerApiUserId],
  );

  const apiBundle = usePrototypeRuntimeRuntimeApiBundle({
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

  const operationalSyncEnabled = useMemo(
    () => loggedIn
      && runtimeApiStoresReady
      && isUuid(closeoutsApiOrganizationId)
      && (closeoutsApiEnabled || entriesApiEnabled),
    [
      closeoutsApiEnabled,
      closeoutsApiOrganizationId,
      entriesApiEnabled,
      loggedIn,
      runtimeApiStoresReady,
    ],
  );

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
    setNotebookTheme,
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
