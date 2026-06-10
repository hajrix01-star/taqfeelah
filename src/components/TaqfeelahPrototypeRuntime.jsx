"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DailyCloseoutsProvider } from "@/features/daily-closeouts/DailyCloseoutsProvider";
import { readDailyCloseouts } from "@/features/daily-closeouts/daily-closeouts-demo-store";
import {
  applyNotebookThemeCssVariables,
  isValidNotebookTheme,
} from "@/features/daily-closeouts/notebook-themes";
import EmployeeCloseoutsView from "@/features/employee-closeouts/EmployeeCloseoutsView";
import { readEmployeeNotebookTheme, writeEmployeeNotebookTheme } from "@/features/employee-closeouts/employee-theme-storage";
import NotebookScrollSurface from "@/features/daily-closeouts/NotebookScrollSurface";
import { storeAttachmentPayload } from "@/features/attachments/client/prototype-attachment-storage";
import { EmployeeSettingsScreen } from "./prototype-runtime/prototype-runtime-employee-settings-screen";
import {
  OwnerExpenseScreen,
  OwnerSummaryScreen,
} from "./prototype-runtime/prototype-runtime-owner-entry-screens";
import {
  DuplicateSalesDialog,
  OperationModal,
  QuickAddSheet,
  RestoreOperationDialog,
  SavedOutflowShareDialog,
  VoidOperationDialog,
} from "./prototype-runtime/prototype-runtime-operation-dialogs";
import { resolveOwnerSettingsApiAuth } from "@/features/runtime-settings/client/runtime-settings-bridge";
import {
  findDuplicateSummaryEntries,
  isFutureOperationalEntryDate,
  mergeLastCloseoutDateForStore,
  resolveOperationalEntriesRefreshWarningMessage,
} from "@/features/operations/operational-entry-save-helpers";
import {
  buildPendingDuplicateSummaryState,
  canPersistOperationalEntry,
  findCreatedEntryInRefreshedList,
  persistOperationalEntryLocally,
  persistOperationalEntryThroughApi,
  resolveSummaryLastCloseoutUpdate,
  shouldGateSummarySaveOnDuplicates,
} from "@/features/operations/operational-entry-persist-helpers";
import { resolveRuntimeApiActorContext, usesRuntimeSettingsApi } from "@/core/config/runtime-capabilities";
import { useEmployeeEntryActions } from "@/features/employee-shell/client/use-employee-entry-actions";
import { useEmployeePortalState } from "@/features/employee-shell/client/use-employee-portal-state";
import { useOwnerSettingsState } from "@/features/org-config/client/use-owner-settings-state";
import { getStoreOperationalConfig } from "@/features/org-config/client/store-operational-config";
import { resolveEmployeeCloseoutsFetchWindow } from "@/features/employee-closeouts/employee-closeout-history";
import { useOwnerShellState } from "@/features/owner-shell/client/use-owner-shell-state";
import { useRegisterOperationsState } from "@/features/operations/client/use-register-operations-state";
import { useRegisterSelectionState } from "@/features/operations/client/use-register-selection-state";
import { usePrototypeRuntimeOperationalEntries } from "@/features/operations/client/use-prototype-runtime-operational-entries";
import { usePrototypeRuntimeCloseoutsApi } from "@/features/closeouts/client/use-prototype-runtime-closeouts-api";
import { useEmployeePreferencesFromApi } from "@/features/runtime-settings/client/use-employee-preferences-from-api";
import {
  usePrototypeRuntimeSessionState,
  usePrototypeRuntimeSessionSync,
} from "@/features/auth/client/use-prototype-runtime-session";
import { createPrototypeRuntimeAuthHandlers } from "@/features/auth/client/prototype-runtime-auth-handlers";
import { formatCalendarDate } from "@/features/reports/client/report-period-labels";
import PrototypeAccessScreen from "@/features/demo/PrototypeAccessScreen";
import { EMPTY_STORE_CHANNEL_CONFIG } from "@/features/org-config/client/store-channel-config";
import {
  DEFAULT_STORE_CHANNEL_CONFIG,
  resolveStoreChannelConfig,
  channelName,
  expenseCategories,
  businesses,
  text,
} from "./prototype-runtime/prototype-runtime-demo-data";
import {
  PROTOTYPE_ACCESS_MODE,
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
} from "./prototype-runtime/prototype-runtime-boot";
import { BottomNav, TopBar } from "./prototype-runtime/prototype-runtime-chrome";
import {
  HelpCenterSheet,
  EmployeeLoginScreen,
  LoginScreen,
} from "./prototype-runtime/AuthGateSection";
import { openWhatsAppSupport } from "./prototype-runtime/prototype-runtime-support";
import {
  entryIsActive,
  entryIsVoided,
} from "./prototype-runtime/prototype-runtime-entry-helpers";
import { todayIsoDate } from "./prototype-runtime/prototype-runtime-notebook";
import { OwnerSettingsScreen } from "./prototype-runtime/OwnerSettingsSection";
import { ReportsScreen } from "./prototype-runtime/OwnerReportsSection";
import { AppFontStyles } from "./prototype-runtime/prototype-runtime-app-font-styles";
import {
  buildEntry,
  prototypeOwnerActor,
} from "./prototype-runtime/prototype-runtime-demo-operational-entries";
import { nextDayIso } from "./prototype-runtime/prototype-runtime-date-helpers";
import { OwnerHomeConnected } from "./prototype-runtime/prototype-runtime-owner-home-screen";
import { OwnerRegisterConnected } from "./prototype-runtime/prototype-runtime-owner-register-screen";
import { NotebookShareModal } from "./prototype-runtime/prototype-runtime-notebook-share-modal";
import { OwnerCloseoutEditFlow, OwnerCloseoutModals } from "./prototype-runtime/prototype-runtime-owner-closeout-modals";
import { PrototypeRuntimePullScroll } from "./prototype-runtime/prototype-runtime-pull-scroll";


export default function TaqfeelahPrototypeRuntime() {
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
  } = session;

  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [saved, setSaved] = useState(false);

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
    persistRuntimeSettingsNow,
    runtimeSettingsSyncError,
    orgConfigSyncError,
    orgConfigLoading,
    orgConfigHydrated,
    resolveStoreSalesChannels,
  } = useOwnerSettingsState({
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
    prototypeOwnerActor,
    channelNameFn: channelName,
  });

  const ownerOrgConfigReady = useMemo(
    () => !ORG_CONFIG_API_ENABLED
      || employee
      || (orgConfigHydrated && !orgConfigLoading && activeBusinesses.length > 0),
    [activeBusinesses.length, employee, orgConfigHydrated, orgConfigLoading],
  );

  const {
    employeePage,
    setEmployeePage,
    changeEmployeePage,
    employeeBusinessId,
    setEmployeeBusinessId,
    employeeThemeOverride,
    setEmployeeThemeOverride,
    employeeEntryActive,
    setEmployeeEntryActive,
    employeeAddHandlerRef,
    employeeSettingsOpenerRef,
    activeEmployee,
    assignedEmployeeBusinesses,
    currentEmployeeBusiness,
    currentEmployeeChannelConfig,
    currentEmployeeOperationalConfig,
    employeeNotebookTheme,
    assignedEmployeeBusinessIds,
  } = useEmployeePortalState({
    employee,
    loggedInEmployeeId,
    staff,
    sessionUserId,
    activeBusinesses,
    storeChannelSettings,
    defaultStoreChannelConfig: ORG_CONFIG_API_ENABLED
      ? EMPTY_STORE_CHANNEL_CONFIG
      : DEFAULT_STORE_CHANNEL_CONFIG,
    storeOperationalSettings,
    notebookTheme,
    expenseCategories,
    lastCloseoutDates,
    todayDate: todayIsoDate(),
    nextDay: nextDayIso,
    initialEmployeeBusinessId: prototypeAuthBoot.employeeBusinessId,
    initialEmployeeThemeOverride: prototypeAuthBoot.employee && prototypeAuthBoot.loggedInEmployeeId && !usesRuntimeSettingsApi()
      ? readEmployeeNotebookTheme(prototypeAuthBoot.loggedInEmployeeId)
      : null,
  });

  const employeePreferenceUserId = sessionUserId || activeEmployee?.apiUserId || activeEmployee?.id || "";
  const employeePreferencesApiEnabled = usesRuntimeSettingsApi();

  const hydrateEmployeeThemeFromApi = useCallback((theme) => {
    if (isValidNotebookTheme(theme)) {
      setEmployeeThemeOverride(theme);
    }
  }, [setEmployeeThemeOverride]);

  const {
    syncError: employeePreferencesSyncError,
    persistNotebookTheme,
  } = useEmployeePreferencesFromApi({
    enabled: employeePreferencesApiEnabled && employee && loggedIn && employeeRuntimeReady,
    loggedIn,
    isEmployee: employee,
    lang,
    onHydrateTheme: hydrateEmployeeThemeFromApi,
  });

  const activeEmployeePreferenceTheme = employeePreferenceUserId
    ? employeePreferences?.[employeePreferenceUserId]?.notebookTheme
    : null;

  useEffect(() => {
    if (employeePreferencesApiEnabled) return;
    if (!isValidNotebookTheme(activeEmployeePreferenceTheme)) return;
    if (employeeThemeOverride === activeEmployeePreferenceTheme) return;
    setEmployeeThemeOverride(activeEmployeePreferenceTheme);
  }, [activeEmployeePreferenceTheme, employeePreferencesApiEnabled, employeeThemeOverride, setEmployeeThemeOverride]);

  useEffect(() => {
    if (employeePreferencesApiEnabled) return;
    if (!employeePreferenceUserId || !isValidNotebookTheme(employeeThemeOverride)) return;
    if (
      isValidNotebookTheme(activeEmployeePreferenceTheme)
      && activeEmployeePreferenceTheme !== employeeThemeOverride
    ) return;
    if (employeePreferences?.[employeePreferenceUserId]?.notebookTheme === employeeThemeOverride) return;
    setEmployeePreferences((current) => ({
      ...(current || {}),
      [employeePreferenceUserId]: {
        ...((current || {})[employeePreferenceUserId] || {}),
        notebookTheme: employeeThemeOverride,
      },
    }));
  }, [
    activeEmployeePreferenceTheme,
    employeePreferenceUserId,
    employeePreferences,
    employeePreferencesApiEnabled,
    employeeThemeOverride,
    setEmployeePreferences,
  ]);

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
    reportingBusinesses,
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
    archivedBusinessIds,
  });

  const {
    selected,
    setSelected,
    voidTarget,
    setVoidTarget,
    restoreTarget,
    setRestoreTarget,
    savedOutflowShareTarget,
    setSavedOutflowShareTarget,
    pendingDuplicateSummary,
    setPendingDuplicateSummary,
  } = registerSelection;

  const {
    operationalEntries,
    setOperationalEntries,
    operationalEntriesLoading,
    summaryRefreshKey,
    createOperationalEntryInApi,
    loadOperationalEntriesFromApi,
    syncCloseoutToOperationalEntries,
    removeOperationalEntriesForCloseout,
  } = usePrototypeRuntimeOperationalEntries({
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
    setLastCloseoutDates,
  });

  const {
    ownerPage,
    setOwnerPage,
    selectedBusiness,
    setSelectedBusiness,
    archivedReadOnlyBusinessId,
    setArchivedReadOnlyBusinessId,
    quickAddOpen,
    setQuickAddOpen,
    helpOpen,
    setHelpOpen,
    ownerManageCloseout,
    setOwnerManageCloseout,
    setCloseoutAlerts,
    duplicateSummaryFocus,
    setDuplicateSummaryFocus,
    shareSnapshot,
    setShareSnapshot,
    setAcknowledgedDuplicateSales,
    activeViewBusiness,
    activeOwnerStoreId,
    reportSettingsStoreId,
    duplicateSalesAlerts,
    unseenCloseoutAlerts,
    ownerNotificationsVisible,
    ownerNotificationBadge,
    pushCloseoutAlert,
    openCloseoutAlertInRegister,
    dismissCloseoutAlert,
    openDuplicateSummaryInRegister,
    changeOwnerPage,
    openQuickAddSummary,
    openQuickAddExpense,
    openNotifications,
  } = useOwnerShellState({
    bindsToServerAuth: BINDS_TO_SERVER_AUTH,
    ownerShellPreferences,
    onOwnerShellPreferencesChange: setOwnerShellPreferences,
    operationalEntries,
    activeBusinesses,
    configuredBusinesses,
    storeOperationalSettings,
    closeoutAlertEnabledForBusiness,
    setSelected: registerSelection.setSelected,
  });

  const handleOwnerCloseoutUpdated = useCallback(async (closeout) => {
    if (!closeout) return;
    if (closeout.status === "reviewed") {
      await syncCloseoutToOperationalEntries({ ...closeout, syncedToEntries: false }, { force: true });
      return;
    }
    if (ENTRIES_API_DB_SOURCE) {
      await loadOperationalEntriesFromApi();
      return;
    }
    removeOperationalEntriesForCloseout(closeout.id, closeout.storeId);
  }, [loadOperationalEntriesFromApi, removeOperationalEntriesForCloseout, syncCloseoutToOperationalEntries]);

  const handleOwnerCloseoutDeleted = useCallback(async (closeout) => {
    if (!closeout) return;
    if (ENTRIES_API_DB_SOURCE) {
      await loadOperationalEntriesFromApi();
    } else {
      removeOperationalEntriesForCloseout(closeout.id, closeout.storeId);
    }
    setCloseoutAlerts((current) => current.filter((item) => !(item.businessId === closeout.storeId && item.date === closeout.date)));
    setOwnerManageCloseout((current) => (current?.id === closeout.id ? null : current));
  }, [
    loadOperationalEntriesFromApi,
    removeOperationalEntriesForCloseout,
    setCloseoutAlerts,
    setOwnerManageCloseout,
  ]);

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
    setStoreOperationalSettings,
    employeeBusinessId,
    setEmployeeBusinessId,
    closeoutsApiEnabled,
    entriesApiEnabled,
    configuredBusinesses,
    storeChannelSettings,
  });

  const authHandlers = useMemo(
    () => createPrototypeRuntimeAuthHandlers({
      staff,
      setStaff,
      activeBusinesses,
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
    }),
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
    enterPrototypeAsEmployee,
    enterPrototypeAsOwner,
  } = authHandlers;

  const handleEmployeeNotebookThemeSave = useCallback((theme) => {
    setEmployeeThemeOverride(theme);
    if (employeePreferencesApiEnabled) {
      void persistNotebookTheme(theme);
      return;
    }
    const storageKey = activeEmployee?.id || employeePreferenceUserId;
    if (storageKey) writeEmployeeNotebookTheme(storageKey, theme);
  }, [
    activeEmployee?.id,
    employeePreferenceUserId,
    employeePreferencesApiEnabled,
    persistNotebookTheme,
    setEmployeeThemeOverride,
  ]);

  const ownerAddHandlerRef = useRef(null);
  const [ownerEntryActive, setOwnerEntryActive] = useState(false);
  const [ownerEditCloseout, setOwnerEditCloseout] = useState(null);

  const ownerCloseoutActor = useMemo(() => ({
    id: ownerApiUserId || currentOwnerActor?.userId || "owner",
    apiUserId: ownerApiUserId,
    nameAr: ownerProfile?.nameAr || ownerDisplayName,
    nameEn: ownerProfile?.nameEn || ownerDisplayName,
    submitActorRole: "owner",
  }), [currentOwnerActor?.userId, ownerApiUserId, ownerDisplayName, ownerProfile?.nameAr, ownerProfile?.nameEn]);

  const ownerCloseoutBusiness = useMemo(() => {
    const storeId = activeOwnerStoreId || activeBusinesses[0]?.id;
    return activeBusinesses.find((business) => business.id === storeId) || activeBusinesses[0] || null;
  }, [activeBusinesses, activeOwnerStoreId]);

  const ownerCloseoutChannelConfig = useMemo(
    () => resolveStoreChannelConfig(storeChannelSettings, ownerCloseoutBusiness?.id),
    [ownerCloseoutBusiness?.id, storeChannelSettings],
  );

  const openOwnerCloseoutEntry = useCallback(() => {
    if (!runtimeApiStoresReady) {
      window.alert(lang === "ar"
        ? "جاري تحميل إعدادات المحل من الخادم… انتظر لحظة ثم أعد المحاولة."
        : "Store settings are still loading from the server… wait a moment and try again.");
      return;
    }
    if (!ownerCloseoutBusiness?.id) {
      window.alert(text(lang, "chooseStoreForSummary"));
      return;
    }
    if (activeViewBusiness === "all" && activeBusinesses.length > 1) {
      window.alert(text(lang, "chooseStoreForSummary"));
      return;
    }
    setQuickAddOpen(false);
    setOwnerPage("closeouts");
    window.requestAnimationFrame(() => {
      ownerAddHandlerRef.current?.();
    });
  }, [
    activeBusinesses.length,
    activeViewBusiness,
    lang,
    ownerCloseoutBusiness?.id,
    runtimeApiStoresReady,
    setOwnerPage,
    setQuickAddOpen,
  ]);

  const handleOpenQuickAddSummary = useCallback(() => {
    if (ENTRIES_API_DB_SOURCE) {
      openOwnerCloseoutEntry();
      return;
    }
    openQuickAddSummary();
  }, [openOwnerCloseoutEntry, openQuickAddSummary]);

  const handleOpenQuickAddExpense = useCallback(() => {
    if (ENTRIES_API_DB_SOURCE) {
      openOwnerCloseoutEntry();
      return;
    }
    openQuickAddExpense();
  }, [openOwnerCloseoutEntry, openQuickAddExpense]);

  const handleOwnerQuickAddOpen = useCallback(() => {
    setQuickAddOpen(true);
  }, [setQuickAddOpen]);

  const reportChannelConfig = resolveStoreChannelConfig(storeChannelSettings, reportSettingsStoreId);
  const activeBusinessIds = activeBusinesses.map((business) => business.id);
  const todayDate = todayIsoDate();

  useEffect(() => {
    applyNotebookThemeCssVariables(employee ? employeeNotebookTheme : notebookTheme);
  }, [employee, employeeNotebookTheme, notebookTheme]);

  const saveOwner = async (payload) => {
    if (ENTRIES_API_DB_SOURCE) {
      window.alert(text(lang, "closeoutRequiredForEntry"));
      return;
    }
    if (!canPersistOperationalEntry({
      saving: savingRef.current,
      payload,
      allowedBusinessIds: activeBusinessIds,
    })) return;
    if (isFutureOperationalEntryDate(payload.date, todayDate)) { window.alert(text(lang, "futureDateNotAllowed")); return; }
    savingRef.current = true; setSaving(true);
    try {
      if (entriesApiEnabled) {
        const result = await persistOperationalEntryThroughApi({
          createOperationalEntryInApi,
          loadOperationalEntriesFromApi,
          payload,
          actorUserId: ownerApiUserId,
          actorRole: "owner",
          lang,
          entriesApiDbSource: ENTRIES_API_DB_SOURCE,
        });
        if (!result.ok) {
          window.alert(result.failureMessage);
          return;
        }
        if (result.refreshFailed) {
          window.alert(resolveOperationalEntriesRefreshWarningMessage(lang));
        }
        if (payload.type === "summary") {
          const summaryUpdate = resolveSummaryLastCloseoutUpdate(
            payload,
            result.refreshed,
            result.created.id,
            entryIsActive,
          );
          setLastCloseoutDates((current) => ({
            ...current,
            [summaryUpdate.businessId]: summaryUpdate.date,
          }));
        }
        setOwnerPage("home");
        if (payload.type !== "summary") {
          setSavedOutflowShareTarget(findCreatedEntryInRefreshedList(result.refreshed, result.created.id));
        } else {
          setSaved(true); window.setTimeout(() => setSaved(false), 2200);
        }
        return;
      }
      const local = await persistOperationalEntryLocally({
        payload,
        actor: currentOwnerActor,
        buildEntry,
        storeAttachmentPayload,
      });
      if (!local.ok) {
        if (local.attachmentFailed) window.alert(text(lang, "attachmentSaveFailed"));
        return;
      }
      setOperationalEntries((current) => [local.entry, ...current]);
      if (payload.type === "summary") {
        setLastCloseoutDates((current) => mergeLastCloseoutDateForStore(current, payload.businessId, payload.date));
      }
      setOwnerPage("home");
      if (payload.type !== "summary") setSavedOutflowShareTarget(local.entry);
      else { setSaved(true); window.setTimeout(() => setSaved(false), 2200); }
    } catch (error) {
      const message = error instanceof Error && error.message
        ? error.message
        : (lang === "ar" ? "تعذر حفظ العملية على الخادم." : "Failed to save entry on server.");
      window.alert(message);
    } finally { savingRef.current = false; setSaving(false); }
  };

  const saveOwnerSummary = async (payload) => {
    if (ENTRIES_API_DB_SOURCE) {
      window.alert(text(lang, "closeoutRequiredForEntry"));
      return;
    }
    if (savingRef.current || !payload?.businessId) return;
    if (shouldGateSummarySaveOnDuplicates(payload)) {
      const previousEntries = findDuplicateSummaryEntries(operationalEntries, payload, entryIsActive);
      if (previousEntries.length > 0) {
        setPendingDuplicateSummary(buildPendingDuplicateSummaryState(payload, previousEntries, "owner"));
        return;
      }
    }
    await saveOwner(payload);
  };

  const { persistEmployeeEntry } = useEmployeeEntryActions({
    lang,
    text,
    savingRef,
    setSaving,
    activeEmployee,
    assignedEmployeeBusinessIds,
    entriesApiEnabled,
    entriesApiDbSource: ENTRIES_API_DB_SOURCE,
    createOperationalEntryInApi,
    loadOperationalEntriesFromApi,
    buildEntry,
    storeAttachmentPayload,
    setOperationalEntries,
    setLastCloseoutDates,
    setCloseoutAlerts,
    closeoutAlertEnabledForBusiness,
    setEmployeePage,
    setSaved,
    setPendingDuplicateSummary,
    operationalEntries,
    entryIsActive,
    todayDate,
  });

  const {
    handleOpenOwnerOperation,
    requestVoidOperation,
    requestRestoreOperation,
    confirmVoidOperation,
    confirmRestoreOperation,
    confirmDuplicateSummary,
    acknowledgeDuplicateSales,
  } = useRegisterOperationsState({
    lang,
    setSelected,
    voidTarget,
    setVoidTarget,
    restoreTarget,
    setRestoreTarget,
    pendingDuplicateSummary,
    setPendingDuplicateSummary,
    operationalEntries,
    archivedBusinessIds,
    entriesApiEnabled,
    phase9ApiEnabled,
    entriesApiDbSource: ENTRIES_API_DB_SOURCE,
    closeoutsApiOrganizationId,
    ownerApiUserId,
    currentOwnerActor,
    activeEmployee,
    entryIsActive,
    entryIsVoided,
    bindsToServerAuth: BINDS_TO_SERVER_AUTH,
    closeoutsApiDbSource: CLOSEOUTS_API_DB_SOURCE,
    readDailyCloseouts,
    loadOperationalEntriesFromApi,
    setOperationalEntries,
    setLastCloseoutDates,
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
  });

  const {
    syncSubmitCloseoutToApi,
    loadCloseoutsFromApi,
  } = usePrototypeRuntimeCloseoutsApi({
    lang,
    closeoutsApiEnabled,
    closeoutsApiStrictMode,
    closeoutsApiOrganizationId,
    ownerApiUserId,
    apiActorUserId,
    apiActorRole,
    apiTargetStoreIdsKey,
    employee,
    storeOperationalSettings,
    entriesApiEnabled,
    loadOperationalEntriesFromApi,
    currentEmployeeChannelConfig,
    ownerCloseoutBusiness,
    ownerCloseoutChannelConfig,
  });

  const closeoutsAutoLoadQueryKey = useMemo(() => {
    if (!runtimeApiStoresReady || !apiTargetStoreIdsKey) return "";
    const storeIds = apiTargetStoreIdsKey.split("|").filter(Boolean);
    if (employee) {
      const windowParts = storeIds.map((storeId) => {
        const visibility = getStoreOperationalConfig(storeOperationalSettings, storeId).employeeHistoryVisibility;
        const window = resolveEmployeeCloseoutsFetchWindow(visibility);
        return `${storeId}:${window.dateFrom}-${window.dateTo}`;
      });
      return `employee|${apiTargetStoreIdsKey}|${windowParts.join(",")}`;
    }
    return `owner|${apiTargetStoreIdsKey}`;
  }, [apiTargetStoreIdsKey, employee, runtimeApiStoresReady, storeOperationalSettings]);

  useEffect(() => {
    if (!employeePreferencesSyncError) return;
    console.warn(employeePreferencesSyncError);
  }, [employeePreferencesSyncError]);

  useEffect(() => {
    if (!runtimeSettingsSyncError) return;
    console.warn(runtimeSettingsSyncError);
  }, [runtimeSettingsSyncError]);

  useEffect(() => {
    if (!orgConfigSyncError) return;
    console.warn(orgConfigSyncError);
  }, [orgConfigSyncError]);

  if (!loggedIn) {
    return (
      <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-[100dvh] bg-[#F8F6F0] font-sans text-[#112A46]">
        <AppFontStyles />
        {PROTOTYPE_ACCESS_MODE ? (
          <PrototypeAccessScreen
            lang={lang}
            setLang={setLang}
            onOwner={enterPrototypeAsOwner}
            onEmployee={enterPrototypeAsEmployee}
          />
        ) : authScreen === "owner" ? (
          <LoginScreen lang={lang} setLang={setLang} onOwnerLogin={completeOwnerLogin} onEmployeePortal={() => setAuthScreen("employee")} />
        ) : (
          <EmployeeLoginScreen lang={lang} setLang={setLang} staff={staff} onBack={() => setAuthScreen("owner")} onLogin={completeEmployeeLogin} />
        )}
      </div>
    );
  }
  if (ORG_CONFIG_API_ENABLED && !employee && !ownerOrgConfigReady && !orgConfigSyncError) {
    return (
      <div dir={lang === "ar" ? "rtl" : "ltr"} className="flex min-h-[100dvh] items-center justify-center bg-[#F8F6F0] px-6 font-sans text-[#112A46]">
        <AppFontStyles />
        <p className="text-center text-sm font-bold text-[#827762]">
          {lang === "ar" ? "جاري تحميل بيانات المنشأة من قاعدة البيانات..." : "Loading organization data from database..."}
        </p>
      </div>
    );
  }
  if (ORG_CONFIG_API_ENABLED && !employee && activeBusinesses.length === 0 && orgConfigSyncError) {
    return (
      <div dir={lang === "ar" ? "rtl" : "ltr"} className="flex min-h-[100dvh] items-center justify-center bg-[#F8F6F0] px-6 font-sans text-[#112A46]">
        <AppFontStyles />
        <div className="max-w-sm rounded-3xl bg-white p-6 text-center ring-1 ring-black/[0.045]">
          <p className="text-sm font-black text-[#B44747]">
            {lang === "ar" ? "تعذر تحميل بيانات المنشأة" : "Failed to load organization data"}
          </p>
          <p className="mt-2 text-taq-meta font-bold text-[#827762]">{orgConfigSyncError}</p>
        </div>
      </div>
    );
  }
  return (
    <DailyCloseoutsProvider
      lang={lang}
      ownerName={ownerDisplayName}
      onSyncToOperationalEntries={syncCloseoutToOperationalEntries}
      onSubmitCloseoutToApi={syncSubmitCloseoutToApi}
      loadCloseoutsFromApi={
        closeoutsApiEnabled
        && closeoutsApiOrganizationId
        && runtimeApiStoresReady
          ? loadCloseoutsFromApi
          : null
      }
      closeoutsAutoLoadQueryKey={closeoutsAutoLoadQueryKey}
      apiStrictMode={closeoutsApiStrictMode}
      dbSourceMode={CLOSEOUTS_API_DB_SOURCE}
    >
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-[100dvh] bg-[#F8F6F0] font-sans text-[#112A46]">
      <AppFontStyles />
      <main className="taq-shell relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-[#F8F6F0]">
        <div className="taq-screen relative grid h-[100dvh] max-h-[100dvh] grid-rows-[auto_1fr_auto] overflow-hidden bg-[#F8F6F0]">
          <TopBar
            lang={lang}
            setLang={setLang}
            employee={employee}
            employeeName={employee && activeEmployee ? (lang === "ar" ? activeEmployee.nameAr : activeEmployee.nameEn) : ""}
            notebookMode={employee || (!employee && (ownerPage === "home" || ownerPage === "reports" || ownerPage === "register" || ownerPage === "closeouts"))}
            notebookTheme={employee ? employeeNotebookTheme : notebookTheme}
            onLogout={logout}
            onEmployeeSettings={() => employeeSettingsOpenerRef.current?.()}
            onNotifications={openNotifications}
            showNotifications={ownerNotificationsVisible}
            hasNotificationBadge={ownerNotificationBadge}
          />
          <PrototypeRuntimePullScroll
            lang={lang}
            employee={employee}
            ownerPage={ownerPage}
            employeePage={employeePage}
            employeeEntryActive={employeeEntryActive}
            ownerEntryActive={ownerEntryActive}
            hasActiveEmployee={Boolean(activeEmployee)}
            notebookTheme={employee ? employeeNotebookTheme : notebookTheme}
            onRefreshOperationalEntries={loadOperationalEntriesFromApi}
          >{employee && !activeEmployee && <section className="px-5 pb-24"><div className="rounded-3xl bg-white p-8 text-center text-sm font-bold text-[#827762] ring-1 ring-black/[0.045]">{text(lang, "noActiveEmployee")}</div></section>}{employee && activeEmployee && employeePage === "closeouts" && <EmployeeCloseoutsView lang={lang} employee={activeEmployee} employeeRuntimeReady={employeeRuntimeReady} currentStore={currentEmployeeBusiness} assignedStores={assignedEmployeeBusinesses} onSelectStore={setEmployeeBusinessId} salesChannels={currentEmployeeChannelConfig.channels.filter((channel) => currentEmployeeChannelConfig.activeIds.includes(channel.id) && !channel.retired).map((channel) => ({ ...channel, displayName: channelName(channel, lang) }))} notebookTheme={employeeNotebookTheme} employeeHistoryVisibility={currentEmployeeOperationalConfig.employeeHistoryVisibility || "month"} formatCalendarDate={formatCalendarDate} channelLabel={(channel) => channel.displayName || channelName(channel, lang)} settingsPanel={({ onBack }) => <EmployeeSettingsScreen lang={lang} onBack={onBack} currentStore={currentEmployeeBusiness} assignedStores={assignedEmployeeBusinesses} onSelectStore={setEmployeeBusinessId} employeeNotebookTheme={employeeThemeOverride || employeeNotebookTheme} setEmployeeNotebookTheme={handleEmployeeNotebookThemeSave} onOpenSupport={() => openWhatsAppSupport(lang)} onOpenHelp={() => setHelpOpen(true)} />} onEntryActiveChange={setEmployeeEntryActive} onRegisterAdd={(handler) => { employeeAddHandlerRef.current = handler || (() => {}); }} onRegisterSettingsOpener={(handler) => { employeeSettingsOpenerRef.current = handler || (() => {}); }} saving={saving} trustServerDaySequenceOnly={CLOSEOUTS_API_DB_SOURCE} />}{!employee && ownerPage === "closeouts" && <EmployeeCloseoutsView lang={lang} employee={ownerCloseoutActor} employeeRuntimeReady={runtimeApiStoresReady} currentStore={ownerCloseoutBusiness} assignedStores={activeBusinesses} onSelectStore={setSelectedBusiness} salesChannels={ownerCloseoutChannelConfig.channels.filter((channel) => ownerCloseoutChannelConfig.activeIds.includes(channel.id) && !channel.retired).map((channel) => ({ ...channel, displayName: channelName(channel, lang) }))} notebookTheme={notebookTheme} employeeHistoryVisibility="all" formatCalendarDate={formatCalendarDate} channelLabel={(channel) => channel.displayName || channelName(channel, lang)} onRegisterAdd={(handler) => { ownerAddHandlerRef.current = handler || (() => {}); }} onEntryActiveChange={setOwnerEntryActive} saving={saving} trustServerDaySequenceOnly={CLOSEOUTS_API_DB_SOURCE} pageTitle={lang === "ar" ? "تسجيل تقفيلة" : "Record closeout"} onCloseoutSubmitted={() => setOwnerPage("home")} />}{!employee && ownerPage === "home" && <NotebookScrollSurface theme={notebookTheme} lang={lang}><OwnerHomeConnected lang={lang} operationalEntries={operationalEntries} operationalEntriesLoading={operationalEntriesLoading} duplicateSalesAlerts={duplicateSalesAlerts} closeoutAlerts={unseenCloseoutAlerts} onOpenCloseoutAlertInRegister={openCloseoutAlertInRegister} onDismissCloseout={dismissCloseoutAlert} onOpenDuplicateSummaryInRegister={openDuplicateSummaryInRegister} onAcknowledgeDuplicate={acknowledgeDuplicateSales} onOpenOperation={handleOpenOwnerOperation} onShareNotebook={setShareSnapshot} notebookTheme={notebookTheme} selectedBusiness={activeViewBusiness} setSelectedBusiness={setSelectedBusiness} businessesList={activeBusinesses} summaryApiEnabled={entriesApiEnabled} summaryApiOrganizationId={closeoutsApiOrganizationId} summaryApiActorUserId={ownerApiUserId} summaryApiActorRole="owner" summaryRefreshKey={summaryRefreshKey} /></NotebookScrollSurface>}{!employee && ownerPage === "add-summary" && !ENTRIES_API_DB_SOURCE && <OwnerSummaryScreen lang={lang} saving={saving} selectedBusiness={activeViewBusiness} businessesList={activeBusinesses} storeChannelSettings={storeChannelSettings} onBack={() => setOwnerPage("home")} onSave={saveOwnerSummary} />}{!employee && ownerPage === "add-expense" && !ENTRIES_API_DB_SOURCE && <OwnerExpenseScreen lang={lang} saving={saving} selectedBusiness={activeViewBusiness} businessesList={activeBusinesses} storeOperationalSettings={storeOperationalSettings} onBack={() => setOwnerPage("home")} onSave={saveOwner} />}{!employee && ownerPage === "reports" && <NotebookScrollSurface theme={notebookTheme} lang={lang}><ReportsScreen lang={lang} operationalEntries={operationalEntries} operationalEntriesLoading={operationalEntriesLoading} archivedReadOnlyBusinessId={archivedReadOnlyBusinessId} onShareNotebook={setShareSnapshot} notebookTheme={notebookTheme} setNotebookTheme={setNotebookTheme} selectedBusiness={selectedBusiness} setSelectedBusiness={setSelectedBusiness} configuredChannels={reportChannelConfig.channels} businessesList={reportingBusinesses} archivedBusinessIds={archivedBusinessIds} reportsApiEnabled={entriesApiEnabled} reportsApiOrganizationId={closeoutsApiOrganizationId} reportsApiActorUserId={ownerApiUserId} reportsApiActorRole="owner" summaryRefreshKey={summaryRefreshKey} /></NotebookScrollSurface>}{!employee && ownerPage === "register" && <OwnerRegisterConnected lang={lang} onOpenOperation={handleOpenOwnerOperation} duplicateSummaryFocus={duplicateSummaryFocus} archivedReadOnlyBusinessId={archivedReadOnlyBusinessId} operationalEntries={operationalEntries} selectedBusiness={selectedBusiness} setSelectedBusiness={setSelectedBusiness} businessesList={reportingBusinesses} archivedBusinessIds={archivedBusinessIds} notebookTheme={notebookTheme} registerEntriesApiEnabled={entriesApiEnabled && REGISTER_ENTRIES_PAGINATION_ENABLED} registerEntriesApiOrganizationId={closeoutsApiOrganizationId} registerEntriesApiActorUserId={ownerApiUserId} registerEntriesApiActorRole="owner" registerEntriesRefreshKey={summaryRefreshKey} />}{!employee && ownerPage === "settings" && <OwnerSettingsScreen lang={lang} operationalEntries={operationalEntries} selectedBusiness={selectedBusiness} setSelectedBusiness={setSelectedBusiness} setOwnerPage={setOwnerPage} setArchivedReadOnlyBusinessId={setArchivedReadOnlyBusinessId} setLastCloseoutDates={setLastCloseoutDates} notebookTheme={notebookTheme} setNotebookTheme={setNotebookTheme} employeePreferences={employeePreferences} ownerShellPreferences={ownerShellPreferences} storeChannelSettings={storeChannelSettings} setStoreChannelSettings={setStoreChannelSettings} storeOperationalSettings={storeOperationalSettings} setStoreOperationalSettings={setStoreOperationalSettings} configuredBusinesses={configuredBusinesses} setConfiguredBusinesses={setConfiguredBusinesses} archivedBusinessIds={archivedBusinessIds} setArchivedBusinessIds={setArchivedBusinessIds} staff={staff} setStaff={setStaff} ownerProfile={ownerProfile} setOwnerProfile={setOwnerProfile} authOwnerUsername={authOwnerUsername} setAuthOwnerUsername={setAuthOwnerUsername} authOwnerPassword={authOwnerPassword} setAuthOwnerPassword={setAuthOwnerPassword} authEmployeePins={authEmployeePins} setAuthEmployeePins={setAuthEmployeePins} onPersistSettingsNow={persistRuntimeSettingsNow} onLogout={logout} onOpenSupport={() => openWhatsAppSupport(lang)} onOpenHelp={() => setHelpOpen(true)} />}{saved && <div className="sticky bottom-4 left-4 right-4 z-30 mx-auto max-w-md rounded-2xl bg-[#112A46] p-4 text-xs font-bold text-white">{text(lang, "savedNotice")}</div>}
          </PrototypeRuntimePullScroll>
          {!(employee && employeeEntryActive) && !(!employee && ownerEntryActive) && <BottomNav lang={lang} employee={employee} active={employee ? employeePage : ownerPage} onAdd={() => { if (employee) employeeAddHandlerRef.current?.(); else handleOwnerQuickAddOpen(); }} onChange={(page) => { setQuickAddOpen(false); if (employee) changeEmployeePage(page); else changeOwnerPage(page); }} />}{!employee && <QuickAddSheet lang={lang} employee={false} open={quickAddOpen} onClose={() => setQuickAddOpen(false)} onSummary={handleOpenQuickAddSummary} onExpense={handleOpenQuickAddExpense} />}<OperationModal lang={lang} item={selected} onClose={() => setSelected(null)} onVoid={requestVoidOperation} onRestore={requestRestoreOperation} canVoid={Boolean(selected) && !archivedBusinessIds.includes(selected?.businessId)} canRestore={Boolean(selected) && !archivedBusinessIds.includes(selected?.businessId)} /><DuplicateSalesDialog lang={lang} draft={pendingDuplicateSummary?.payload || null} previousEntries={pendingDuplicateSummary?.previousEntries || []} businessesList={activeBusinesses} onCancel={() => setPendingDuplicateSummary(null)} onConfirm={confirmDuplicateSummary} /><VoidOperationDialog lang={lang} item={voidTarget} onCancel={() => setVoidTarget(null)} onConfirm={confirmVoidOperation} /><RestoreOperationDialog lang={lang} item={restoreTarget} onCancel={() => setRestoreTarget(null)} onConfirm={confirmRestoreOperation} /><SavedOutflowShareDialog lang={lang} item={savedOutflowShareTarget} businessesList={activeBusinesses} onClose={() => setSavedOutflowShareTarget(null)} /><NotebookShareModal lang={lang} snapshot={shareSnapshot} onClose={() => setShareSnapshot(null)} businessesList={reportingBusinesses} operationalEntries={operationalEntries} archivedBusinessIds={archivedBusinessIds} notebookExportApiEnabled={phase9ApiEnabled && entriesApiEnabled} notebookExportAuth={runtimeApiAuth} />
          <OwnerCloseoutModals
            lang={lang}
            ownerManageCloseout={ownerManageCloseout}
            ownerDisplayName={ownerDisplayName}
            ownerNotebookTheme={notebookTheme}
            resolveSalesChannels={resolveStoreSalesChannels}
            channelLabel={(channel) => channel.displayName || channelName(channel, lang)}
            onCloseoutUpdated={handleOwnerCloseoutUpdated}
            onCloseoutDeleted={handleOwnerCloseoutDeleted}
            onClose={() => setOwnerManageCloseout(null)}
            onOwnerEditCloseout={(closeout) => {
              setOwnerManageCloseout(null);
              setOwnerEditCloseout(closeout);
            }}
          />
          <OwnerCloseoutEditFlow
            lang={lang}
            editCloseout={ownerEditCloseout}
            ownerActor={ownerCloseoutActor}
            ownerNotebookTheme={notebookTheme}
            resolveSalesChannels={resolveStoreSalesChannels}
            channelLabel={(channel) => channel.displayName || channelName(channel, lang)}
            onCloseoutUpdated={handleOwnerCloseoutUpdated}
            onClose={() => setOwnerEditCloseout(null)}
          />
          <HelpCenterSheet lang={lang} open={helpOpen} onClose={() => setHelpOpen(false)} />
        </div>
      </main>
    </div>
    </DailyCloseoutsProvider>
  );
}
