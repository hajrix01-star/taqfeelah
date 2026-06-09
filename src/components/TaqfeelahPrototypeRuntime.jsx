"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DailyCloseoutsProvider, useDailyCloseouts } from "@/features/daily-closeouts/DailyCloseoutsProvider";
import { buildOperationalEntriesFromCloseout, readDailyCloseouts } from "@/features/daily-closeouts/daily-closeouts-demo-store";
import {
  applyNotebookThemeCssVariables,
  isValidNotebookTheme,
  notebookCardBackground,
  notebookThemes,
} from "@/features/daily-closeouts/notebook-themes";
import { shareImageThroughWhatsApp } from "@/features/daily-closeouts/notebook-image-sharing";
import EmployeeCloseoutsView from "@/features/employee-closeouts/EmployeeCloseoutsView";
import DailyCloseoutEntryFlow from "@/features/employee-closeouts/DailyCloseoutEntryFlow";
import { employeeDisplayName } from "@/features/employee-closeouts/employee-entries-display";
import {
  patchRuntimeApiMapsForEmployeeSession,
  syncLoggedInEmployeeIdFromSession,
} from "@/features/employee-closeouts/employee-portal-session";
import { readEmployeeNotebookTheme, writeEmployeeNotebookTheme } from "@/features/employee-closeouts/employee-theme-storage";
import PendingCloseoutsNotice from "@/features/owner-closeout-review/PendingCloseoutsNotice";
import OwnerCloseoutReviewPanel from "@/features/owner-closeout-review/OwnerCloseoutReviewPanel";
import ReturnCloseoutModal from "@/features/owner-closeout-review/ReturnCloseoutModal";
import NotebookScrollSurface from "@/features/daily-closeouts/NotebookScrollSurface";
import { readLocalStorageJson, safeSetLocalStorageItem } from "@/features/demo/prototype-storage";
import { createPrototypeMonthDemoOperationalEntries } from "@/features/demo/prototype-month-demo-seed";
import { AnimatePresence, motion } from "framer-motion";
import {
  makeAttachment,
  storeAttachmentPayload,
  stripEmbeddedAttachmentImages,
} from "@/features/attachments/client/prototype-attachment-storage";
import { AttachmentPreview } from "./prototype-runtime/prototype-runtime-attachment-ui";
import { toAmount } from "./prototype-runtime/prototype-runtime-entry-form-utils";
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
import {
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
  Send,
  X,
} from "lucide-react";
import { buildRuntimeApiIdMaps } from "@/core/client/runtime-api-id-maps";
import {
  buildCloseoutSubmitFailureMessage,
  diagnoseCloseoutSubmitFailure,
  fetchStoreCloseoutsViaApi,
  hasCloseoutApiActorMapping,
  hasCloseoutApiStoreMapping,
  isUuid,
  reviewCloseoutViaApi,
  setRuntimeApiIdMaps,
  submitCloseoutViaApi,
} from "@/features/closeouts/client/closeouts-api-client";
import { formatCloseoutDayLabel } from "@/features/closeouts/client/closeout-day-label";
import {
  buildRegisterCloseoutDayContext,
  summaryEntryDisplayAmount,
} from "@/features/entries/client/register-operation-display";
import {
  createStoreEntryViaApi,
  fetchStoreEntriesViaApi,
} from "@/features/entries/client/store-entries-api-client";
import { useNotebookExportShareData } from "@/features/phase9/client/use-notebook-export-share-data";
import { resolvePayloadAttachmentForPhase9Api } from "@/features/phase9/client/inline-attachment-api-flow";
import {
  applyEmployeeLoginSuccess,
  applyLogoutReset,
  applyOwnerLoginSuccess,
  applyServerSessionBootstrap,
} from "@/features/auth/client/auth-runtime-orchestrator";
import {
  fetchServerSessionStatus,
  logoutViaSessionBridge,
} from "@/features/auth/client/session-bridge";
import { resolveOwnerSettingsApiAuth } from "@/features/runtime-settings/client/runtime-settings-bridge";
import { buildOperationalEntry } from "@/features/entries/client/build-operational-entry";
import {
  findDuplicateSummaryEntries,
  isFutureOperationalEntryDate,
  mergeLastCloseoutDateForStore,
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
import { resolveOperationalEntriesBulkLoadWindow } from "@/features/entries/client/register-entries-load-window";
import { resolveRuntimeApiActorContext } from "@/core/config/runtime-capabilities";
import { useEmployeeEntryActions } from "@/features/employee-shell/client/use-employee-entry-actions";
import { useEmployeePortalState } from "@/features/employee-shell/client/use-employee-portal-state";
import { applyOrgConfigMappedState } from "@/features/org-config/client/org-config-runtime-bridge";
import { loadEmployeeRuntimeContextFromApi } from "@/features/org-config/client/employee-runtime-hydration";
import { useOwnerSettingsState } from "@/features/org-config/client/use-owner-settings-state";
import { refreshOperationalEntriesBestEffort } from "@/features/operations/client/refresh-operational-entries-best-effort";
import { useOwnerShellState } from "@/features/owner-shell/client/use-owner-shell-state";
import { resolveSelectedOperationReviewEnabled } from "@/features/operations/client/register-operations-selection";
import { useRegisterOperationsState } from "@/features/operations/client/use-register-operations-state";
import { useRegisterSelectionState } from "@/features/operations/client/use-register-selection-state";
import { useRegisterEntriesFromApi } from "@/features/entries/client/use-register-entries-from-api";
import { useStoreDaySummaries } from "@/features/reports/client/use-store-day-summaries";
import { getStoreOperationalConfig } from "@/features/org-config/client/store-operational-config";
import {
  aggregateChannels,
  buildBusinessesWithEntrySummaries,
  entriesInPeriod,
  entryTotalsHaveFinancialActivity,
  newestEntries,
  resolveOwnerPeriodSummaryPreference,
  resolveOwnerSingleStoreTotals,
  summarizeEntries,
  summaryDayFromEntries,
  summaryMonthFromEntries,
} from "@/features/operations/operational-analytics";
import { groupAttachmentsFromEntries } from "@/features/entries/client/attachments-from-entries";
import {
  DEFAULT_REGISTER_LOG_FILTERS,
  buildRegisterCloseoutSummaries,
  buildRegisterSalesChannelOptions,
  filterRegisterLogEntries,
  registerLogFilterCount,
  summarizeRegisterPeriod,
} from "@/features/entries/client/register-log-display";
import {
  formatCalendarDate,
  formatSelectedMonth,
  logPeriodScopeLabel,
} from "@/features/reports/client/report-period-labels";
import PrototypeAccessScreen from "@/features/demo/PrototypeAccessScreen";
import { readPrototypeAccessAuthContext } from "@/core/client/prototype-access-auth-context";
import { EMPTY_STORE_CHANNEL_CONFIG } from "@/features/org-config/client/store-channel-config";
import {
  channels,
  DEFAULT_STORE_CHANNEL_CONFIG,
  resolveStoreChannelConfig,
  channelName,
  expenseCategories,
  outflowReportCategories,
  businesses,
  businessName,
  businessLocation,
  text,
  money,
  fullDate,
  opTime,
} from "./prototype-runtime/prototype-runtime-demo-data";
import {
  APP_IN_PRODUCTION_MODE,
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
  OPERATIONAL_ENTRIES_STORAGE_KEY,
  PROTOTYPE_DEFAULT_STAFF,
} from "./prototype-runtime/prototype-runtime-boot";
import { BottomNav, Logo, TopBar } from "./prototype-runtime/prototype-runtime-chrome";
import {
  HelpCenterSheet,
  EmployeeLoginScreen,
  LoginScreen,
  readPrototypeAuthBoot,
} from "./prototype-runtime/AuthGateSection";
import { openWhatsAppSupport } from "./prototype-runtime/prototype-runtime-support";

import {
  noteLabel,
  entryCategory,
  operationDisplayLabel,
  expandRegisterCloseoutOperationRows,
  signedEntryAmount,
  entryDateMatches,
  entryHasAttachment,
  entryIsActive,
  entryIsVoided,
  entryIsOutflow,
} from "./prototype-runtime/prototype-runtime-entry-helpers";
import {
  Notebook,
  NotebookRow,
  MoneyValue,
  NumberLine,
  FinancialRows,
  isoCalendarDate,
  todayIsoDate,
  DateSelector,
  StoreScopeTabs,
  StoreComparison,
  NotebookHeading,
} from "./prototype-runtime/prototype-runtime-notebook";
import { OwnerSettingsScreen } from "./prototype-runtime/OwnerSettingsSection";
import { RatioBadge, ReportsScreen } from "./prototype-runtime/OwnerReportsSection";
import { Badge, InkTab } from "./prototype-runtime/prototype-runtime-shell-ui";

import { AppFontStyles } from "./prototype-runtime/prototype-runtime-app-font-styles";
import {
  buildEntry,
  isoDaysAgo,
  prototypeOwnerActor,
  readOperationalEntries,
} from "./prototype-runtime/prototype-runtime-demo-operational-entries";
import { nextDayIso } from "./prototype-runtime/prototype-runtime-date-helpers";
import { OwnerHomeConnected } from "./prototype-runtime/prototype-runtime-owner-home-screen";
import { OwnerRegisterConnected } from "./prototype-runtime/prototype-runtime-owner-register-screen";
import { NotebookShareModal } from "./prototype-runtime/prototype-runtime-notebook-share-modal";
import { OwnerCloseoutModals } from "./prototype-runtime/prototype-runtime-owner-closeout-modals";


export default function TaqfeelahPrototypeRuntime() {
  const [lang, setLang] = useState("ar");
  const [sessionOrganizationId, setSessionOrganizationId] = useState("");
  const [sessionUserId, setSessionUserId] = useState("");
  const [loggedIn, setLoggedIn] = useState(() => readPrototypeAuthBoot().loggedIn);
  const [authScreen, setAuthScreen] = useState("owner");
  const [employee, setEmployee] = useState(() => readPrototypeAuthBoot().employee);
  const [loggedInEmployeeId, setLoggedInEmployeeId] = useState(() => readPrototypeAuthBoot().loggedInEmployeeId);
  const [employeeRuntimeReady, setEmployeeRuntimeReady] = useState(() => !readPrototypeAuthBoot().employee);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [saved, setSaved] = useState(false);
  const [operationalEntries, setOperationalEntries] = useState(() => readOperationalEntries());
  const [operationalEntriesLoading, setOperationalEntriesLoading] = useState(false);
  const [operationalEntriesSyncError, setOperationalEntriesSyncError] = useState("");
  const [summaryRefreshKey, setSummaryRefreshKey] = useState(0);
  const loadOperationalEntriesFromApiRef = useRef(async () => []);
  const prototypeAuthBoot = readPrototypeAuthBoot();

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
    reviewEnabledForBusiness,
    closeoutReviewEnabledForBusiness,
    attachmentAlertEnabledForBusiness,
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
    currentEmployeeCategories,
    employeeNotebookTheme,
    suggestedEntryDate,
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
    initialEmployeeThemeOverride: prototypeAuthBoot.employee && prototypeAuthBoot.loggedInEmployeeId
      ? readEmployeeNotebookTheme(prototypeAuthBoot.loggedInEmployeeId)
      : null,
  });

  const activeEmployeePreferenceTheme = activeEmployee?.id
    ? employeePreferences?.[activeEmployee.id]?.notebookTheme
    : null;

  useEffect(() => {
    if (!isValidNotebookTheme(activeEmployeePreferenceTheme)) return;
    if (employeeThemeOverride === activeEmployeePreferenceTheme) return;
    setEmployeeThemeOverride(activeEmployeePreferenceTheme);
  }, [activeEmployeePreferenceTheme, employeeThemeOverride, setEmployeeThemeOverride]);

  useEffect(() => {
    if (!activeEmployee?.id || !isValidNotebookTheme(employeeThemeOverride)) return;
    if (
      isValidNotebookTheme(activeEmployeePreferenceTheme)
      && activeEmployeePreferenceTheme !== employeeThemeOverride
    ) return;
    if (employeePreferences?.[activeEmployee.id]?.notebookTheme === employeeThemeOverride) return;
    setEmployeePreferences((current) => ({
      ...(current || {}),
      [activeEmployee.id]: {
        ...((current || {})[activeEmployee.id] || {}),
        notebookTheme: employeeThemeOverride,
      },
    }));
  }, [activeEmployee?.id, activeEmployeePreferenceTheme, employeePreferences, employeeThemeOverride, setEmployeePreferences]);

  const {
    closeoutsApiEnabled,
    closeoutsApiStrictMode,
    entriesApiEnabled,
    entriesApiStrictMode,
    phase9ApiEnabled,
    organizationId: closeoutsApiOrganizationId,
    ownerUserId: closeoutsApiOwnerUserId,
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

  const createOperationalEntryInApi = useCallback(async ({ payload, actorUserId, actorRole }) => {
    if (!entriesApiEnabled) {
      if (entriesApiStrictMode) throw new Error("entries API is disabled in production mode.");
      return null;
    }
    if (!isUuid(closeoutsApiOrganizationId)) {
      if (entriesApiStrictMode) throw new Error("organization id is missing/invalid for entries API.");
      return null;
    }
    const apiPayload = await resolvePayloadAttachmentForPhase9Api({
      enabled: phase9ApiEnabled,
      organizationId: closeoutsApiOrganizationId,
      actorUserId,
      actorRole,
      storeId: payload?.businessId,
      payload,
    });
    return createStoreEntryViaApi({
      organizationId: closeoutsApiOrganizationId,
      actorUserId,
      actorRole,
      payload: apiPayload,
    });
  }, [closeoutsApiOrganizationId, entriesApiEnabled, entriesApiStrictMode, phase9ApiEnabled]);

  const loadOperationalEntriesFromApi = useCallback(async () => {
    if (!entriesApiEnabled) {
      if (entriesApiStrictMode) throw new Error("entries API is disabled in production mode.");
      return [];
    }
    if (!isUuid(closeoutsApiOrganizationId)) {
      const message = lang === "ar"
        ? "تعذر تحميل العمليات: معرف المنظمة غير صالح لمسار API."
        : "Failed to load operations: organization id is missing/invalid for entries API.";
      setOperationalEntriesSyncError(message);
      throw new Error(message);
    }
    if (!hasCloseoutApiActorMapping(apiActorUserId)) {
      const message = lang === "ar"
        ? "تعذر تحميل العمليات: معرف المستخدم غير مربوط بالخادم."
        : "Failed to load operations: actor user id is missing/invalid for entries API.";
      setOperationalEntriesSyncError(message);
      throw new Error(message);
    }

    const targetStoreIds = apiTargetStoreIdsKey ? apiTargetStoreIdsKey.split("|").filter(Boolean) : [];
    setOperationalEntriesLoading(true);
    if (!targetStoreIds.length) {
      setOperationalEntries([]);
      setOperationalEntriesLoading(false);
      return [];
    }

    try {
      const dateTo = todayIsoDate();
      const { lookbackDays, limit: bulkLimit } = resolveOperationalEntriesBulkLoadWindow({
        paginationEnabled: REGISTER_ENTRIES_PAGINATION_ENABLED,
      });
      const dateFrom = isoDaysAgo(lookbackDays);

      const fetched = await Promise.all(
        targetStoreIds.map((storeId) => fetchStoreEntriesViaApi({
          organizationId: closeoutsApiOrganizationId,
          actorUserId: apiActorUserId,
          actorRole: apiActorRole,
          storeId,
          dateFrom,
          dateTo,
          status: "all",
          limit: bulkLimit,
        })),
      );

      const merged = fetched.flatMap((items) => (Array.isArray(items) ? items : []));
      const seen = new Set();
      const deduped = merged.filter((item) => {
        const itemId = typeof item?.id === "string" ? item.id : "";
        if (!itemId || seen.has(itemId)) return false;
        seen.add(itemId);
        return true;
      });

      setOperationalEntries(deduped);
      setOperationalEntriesSyncError("");
      setSummaryRefreshKey((current) => current + 1);
      return deduped;
    } finally {
      setOperationalEntriesLoading(false);
    }
  }, [
    apiActorRole,
    apiActorUserId,
    apiTargetStoreIdsKey,
    closeoutsApiOrganizationId,
    entriesApiEnabled,
    entriesApiStrictMode,
    lang,
  ]);

  loadOperationalEntriesFromApiRef.current = loadOperationalEntriesFromApi;

  const registerSelection = useRegisterSelectionState({
    reviewEnabledForBusiness,
    archivedBusinessIds,
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
    ownerReviewCloseout,
    setOwnerReviewCloseout,
    returnCloseoutTarget,
    setReturnCloseoutTarget,
    closeoutAlerts,
    setCloseoutAlerts,
    duplicateReviewFocus,
    setDuplicateReviewFocus,
    attachmentReviewRequest,
    setAttachmentReviewRequest,
    shareSnapshot,
    setShareSnapshot,
    acknowledgedDuplicateSales,
    setAcknowledgedDuplicateSales,
    activeViewBusiness,
    activeOwnerStoreId,
    reportSettingsStoreId,
    ownerReviewEnabled,
    duplicateSalesAlerts,
    firstPendingAttachmentReview,
    unseenCloseoutAlerts,
    ownerNotificationsVisible,
    ownerNotificationBadge,
    pushCloseoutAlert,
    reviewCloseoutAlert,
    dismissCloseoutAlert,
    reviewDuplicateSales,
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
    reviewEnabledForBusiness,
    attachmentAlertEnabledForBusiness,
    closeoutAlertEnabledForBusiness,
    setSelected: registerSelection.setSelected,
  });

  const ownerAddHandlerRef = useRef(null);
  const [ownerEntryActive, setOwnerEntryActive] = useState(false);

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
  const selectedOperationReviewEnabled = useMemo(
    () => resolveSelectedOperationReviewEnabled(
      selected,
      reviewEnabledForBusiness,
      archivedBusinessIds,
      ownerReviewEnabled,
    ),
    [archivedBusinessIds, ownerReviewEnabled, reviewEnabledForBusiness, selected],
  );

  useEffect(() => {
    if (!APP_IN_PRODUCTION_MODE) return;
    let cancelled = false;
    fetchServerSessionStatus()
      .then((session) => {
        if (cancelled) return;
        applyServerSessionBootstrap(session, {
          setSessionOrganizationId,
          setSessionUserId,
          setSessionOrganizationId,
          setLoggedIn,
          setAuthScreen,
          setEmployee,
          setLoggedInEmployeeId,
          setEmployeePage,
          setOwnerPage,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn("session bootstrap failed", error);
        setSessionOrganizationId("");
        setSessionUserId("");
        setSessionOrganizationId("");
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!BINDS_TO_SERVER_AUTH || !employee || !sessionUserId) return;
    const syncedEmployeeId = syncLoggedInEmployeeIdFromSession(staff, sessionUserId, loggedInEmployeeId);
    if (syncedEmployeeId) {
      setLoggedInEmployeeId(syncedEmployeeId);
    }
  }, [employee, loggedInEmployeeId, sessionUserId, staff]);
  const reportChannelConfig = resolveStoreChannelConfig(storeChannelSettings, reportSettingsStoreId);
  const activeBusinessIds = activeBusinesses.map((business) => business.id);
  const todayDate = todayIsoDate();
  useEffect(() => {
    applyNotebookThemeCssVariables(employee ? employeeNotebookTheme : notebookTheme);
  }, [employee, employeeNotebookTheme, notebookTheme]);
  useEffect(() => {
    if (BINDS_TO_SERVER_AUTH || ENTRIES_API_DB_SOURCE || typeof window === "undefined") return;
    safeSetLocalStorageItem(
      OPERATIONAL_ENTRIES_STORAGE_KEY,
      JSON.stringify(stripEmbeddedAttachmentImages(operationalEntries)),
      { scope: "operational-fallback" },
    );
  }, [operationalEntries]);
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

  const { persistEmployeeEntry, saveEmployee } = useEmployeeEntryActions({
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
    confirmReview,
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
    setReturnCloseoutTarget,
    setOwnerReviewCloseout,
    pushCloseoutAlert,
    saveOwner,
    persistEmployeeEntry,
    savingRef,
    setSaving,
  });

  const completeOwnerLogin = (apiUserId = "", organizationId = "") => {
    applyOwnerLoginSuccess({
      apiUserId,
      organizationId,
      prototypeAccessMode: PROTOTYPE_ACCESS_MODE,
      apply: {
        setSessionOrganizationId,
        setSessionUserId,
        setSessionOrganizationId,
        setLoggedIn,
        setEmployee,
        setLoggedInEmployeeId,
        setAuthScreen,
        setOwnerPage,
      },
    });
  };
  const completeEmployeeLogin = (personId, apiUserId = "", rosterPerson = null, organizationId = "") => {
    const loginStaff = rosterPerson && !staff.some((person) => person.id === rosterPerson.id)
      ? [rosterPerson, ...staff]
      : staff;
    if (rosterPerson) {
      setStaff((current) => (
        current.some((person) => person.id === rosterPerson.id)
          ? current
          : [rosterPerson, ...current]
      ));
    }
    applyEmployeeLoginSuccess({
      personId,
      apiUserId,
      organizationId,
      staff: loginStaff,
      activeBusinesses,
      prototypeAccessMode: PROTOTYPE_ACCESS_MODE,
      apply: {
        setSessionOrganizationId,
        setSessionUserId,
        setLoggedIn,
        setEmployee,
        setLoggedInEmployeeId,
        setEmployeeBusinessId,
        setEmployeeThemeOverride,
        setEmployeePage,
        setAuthScreen,
      },
    });
  };
  const removeOperationalEntriesForCloseout = useCallback((closeoutId, storeId = null) => {
    if (!closeoutId) return;
    setOperationalEntries((current) => {
      const next = current.filter((entry) => entry.closeoutId !== closeoutId);
      if (storeId) {
        const latestActiveCloseoutDate = next
          .filter((entry) => entry.businessId === storeId && entry.type === "summary" && entryIsActive(entry))
          .map((entry) => entry.date)
          .sort()
          .pop();
        setLastCloseoutDates((prev) => {
          const updated = { ...prev };
          if (latestActiveCloseoutDate) updated[storeId] = latestActiveCloseoutDate;
          else delete updated[storeId];
          return updated;
        });
      }
      return next;
    });
  }, []);

  const syncCloseoutToOperationalEntries = useCallback(async (closeout, { force = false } = {}) => {
    if (ENTRIES_API_DB_SOURCE) {
      if (typeof loadOperationalEntriesFromApiRef.current === "function") {
        await loadOperationalEntriesFromApiRef.current();
      }
      return;
    }
    if (!closeout) return;
    if (!force && closeout.syncedToEntries) return;
    if (force) {
      removeOperationalEntriesForCloseout(closeout.id, closeout.storeId);
    }
    const actor = {
      role: "employee",
      userId: closeout.submittedByUserId || closeout.openedByUserId,
      nameAr: closeout.submittedByName || closeout.openedByName,
      nameEn: closeout.submittedByName || closeout.openedByName,
    };
    const { entries } = buildOperationalEntriesFromCloseout(closeout, actor);
    const created = [];
    for (const item of entries) {
      const entry = buildEntry(item.payload, actor);
      if (item.payload.attachment || item.attachment) {
        const attachmentPayload = item.payload.attachment || item.attachment;
        try {
          await storeAttachmentPayload(attachmentPayload);
          entry.attachment = makeAttachment(entry.id, attachmentPayload);
        } catch {
          window.alert(text(lang, "attachmentSaveFailed"));
        }
      }
      created.push(entry);
    }
    if (created.length) {
      setOperationalEntries((current) => [...created, ...current]);
      const summaryEntry = created.find((entry) => entry.type === "summary");
      if (summaryEntry) {
        setLastCloseoutDates((current) => mergeLastCloseoutDateForStore(current, summaryEntry.businessId, summaryEntry.date));
      }
    }
  }, [lang, removeOperationalEntriesForCloseout]);

  const handleOwnerCloseoutUpdated = useCallback(async (closeout) => {
    if (!closeout) return;
    if (closeout.status === "reviewed") {
      await syncCloseoutToOperationalEntries({ ...closeout, syncedToEntries: false }, { force: true });
      return;
    }
    if (ENTRIES_API_DB_SOURCE) {
      if (typeof loadOperationalEntriesFromApiRef.current === "function") {
        await loadOperationalEntriesFromApiRef.current();
      }
      return;
    }
    removeOperationalEntriesForCloseout(closeout.id, closeout.storeId);
  }, [removeOperationalEntriesForCloseout, syncCloseoutToOperationalEntries]);

  const handleOwnerCloseoutDeleted = useCallback(async (closeout) => {
    if (!closeout) return;
    if (ENTRIES_API_DB_SOURCE) {
      if (typeof loadOperationalEntriesFromApiRef.current === "function") {
        await loadOperationalEntriesFromApiRef.current();
      }
    } else {
      removeOperationalEntriesForCloseout(closeout.id, closeout.storeId);
    }
    setCloseoutAlerts((current) => current.filter((item) => !(item.businessId === closeout.storeId && item.date === closeout.date)));
    setOwnerReviewCloseout((current) => (current?.id === closeout.id ? null : current));
    setReturnCloseoutTarget((current) => (current?.id === closeout.id ? null : current));
  }, [removeOperationalEntriesForCloseout]);
  const logout = async () => {
    try {
      await logoutViaSessionBridge({ useServerAuth: APP_IN_PRODUCTION_MODE });
    } catch (error) {
      console.warn("logout api failed", error);
    }
    applyLogoutReset({
      bindsToServerAuth: BINDS_TO_SERVER_AUTH,
      apply: {
        setSessionOrganizationId,
        setSessionUserId,
        setSessionOrganizationId,
        setLoggedIn,
        setEmployee,
        setLoggedInEmployeeId,
        setAuthScreen,
        setEmployeePage,
        setOwnerPage,
        setOwnerReviewCloseout,
        setReturnCloseoutTarget,
        setSelected,
        setVoidTarget,
        setRestoreTarget,
        setSavedOutflowShareTarget,
        setPendingDuplicateSummary,
        setDuplicateReviewFocus,
        setAttachmentReviewRequest,
        setShareSnapshot,
        setQuickAddOpen,
        setArchivedReadOnlyBusinessId,
        setSelectedBusiness,
        setOperationalEntries,
        setStaff,
        setConfiguredBusinesses,
        setArchivedBusinessIds,
        setAuthOwnerUsername,
        setAuthOwnerPassword,
        setAuthEmployeePins,
        setOwnerProfile,
      },
    });
  };

  const syncSubmitCloseoutToApi = useCallback(async ({ action, closeout, employee, reviewWorkflowEnabled }) => {
    if (!closeoutsApiEnabled) {
      throw new Error(lang === "ar"
        ? "مسار API للتقفيلات غير مفعّل."
        : "Closeouts API is disabled.");
    }
    const actorUserId = employee?.apiUserId || employee?.id;
    const storeChannels = currentEmployeeChannelConfig?.channels || [];
    const isOwnerSubmit = employee?.submitActorRole === "owner";
    const ownerStoreChannels = isOwnerSubmit && ownerCloseoutBusiness?.id === closeout?.storeId
      ? (ownerCloseoutChannelConfig?.channels || [])
      : storeChannels;
    const submitFailure = diagnoseCloseoutSubmitFailure({
      organizationId: closeoutsApiOrganizationId,
      actorUserId,
      closeout,
      storeChannels: isOwnerSubmit ? ownerStoreChannels : storeChannels,
    });
    if (submitFailure) {
      throw new Error(buildCloseoutSubmitFailureMessage(submitFailure, lang));
    }
    if (
      !isUuid(closeoutsApiOrganizationId)
      || !hasCloseoutApiActorMapping(actorUserId)
      || !hasCloseoutApiStoreMapping(closeout?.storeId)
    ) {
      throw new Error(lang === "ar"
        ? "تعذر إرسال التقفيلة: سياق API غير مكتمل (منظمة/مستخدم/محل)."
        : "Closeout submit blocked: API context is incomplete (organization/user/store).");
    }
    const result = await submitCloseoutViaApi({
      organizationId: closeoutsApiOrganizationId,
      actorUserId,
      actorRole: isOwnerSubmit ? "owner" : "employee",
      closeout,
      storeChannels: isOwnerSubmit ? ownerStoreChannels : storeChannels,
      mode: action === "resubmit" ? "resubmit" : "submit",
      autoReview: isOwnerSubmit ? true : !reviewWorkflowEnabled,
      requireReview: isOwnerSubmit ? false : reviewWorkflowEnabled === true,
    });
    if (!result) {
      throw new Error(lang === "ar"
        ? "تعذر إرسال التقفيلة: لم يُرجع الخادم تأكيدًا."
        : "Closeout submit failed: server returned an empty response.");
    }
    if (entriesApiEnabled) {
      await refreshOperationalEntriesBestEffort(loadOperationalEntriesFromApi);
    }
    return result;
  }, [
    closeoutsApiEnabled,
    closeoutsApiOrganizationId,
    currentEmployeeChannelConfig?.channels,
    entriesApiEnabled,
    lang,
    loadOperationalEntriesFromApi,
    ownerCloseoutBusiness?.id,
    ownerCloseoutChannelConfig?.channels,
  ]);

  const syncReviewCloseoutToApi = useCallback(async ({ action, closeout, reason = "" }) => {
    if (!closeoutsApiEnabled) {
      if (closeoutsApiStrictMode) throw new Error("closeouts API is disabled in production mode.");
      return null;
    }
    if (
      !isUuid(closeoutsApiOrganizationId)
      || !hasCloseoutApiActorMapping(ownerApiUserId)
      || !hasCloseoutApiStoreMapping(closeout?.storeId)
    ) {
      if (closeoutsApiStrictMode) throw new Error("closeouts API mapping is invalid for review.");
      return null;
    }
    const result = await reviewCloseoutViaApi({
      organizationId: closeoutsApiOrganizationId,
      actorUserId: ownerApiUserId,
      actorRole: "owner",
      closeout,
      action,
      reason,
    });
    if (entriesApiEnabled) {
      await refreshOperationalEntriesBestEffort(loadOperationalEntriesFromApi);
    }
    return result;
  }, [
    closeoutsApiEnabled,
    closeoutsApiOrganizationId,
    ownerApiUserId,
    closeoutsApiStrictMode,
    entriesApiEnabled,
    loadOperationalEntriesFromApi,
  ]);

  loadOperationalEntriesFromApiRef.current = loadOperationalEntriesFromApi;

  const loadCloseoutsFromApi = useCallback(async () => {
    if (!closeoutsApiEnabled) {
      if (closeoutsApiStrictMode) throw new Error("closeouts API is disabled in production mode.");
      return [];
    }
    if (!isUuid(closeoutsApiOrganizationId)) {
      throw new Error(
        lang === "ar"
          ? "تعذر تحميل التقفيلات: معرف المنظمة غير صالح لمسار API."
          : "Failed to load closeouts: organization id is missing/invalid for closeouts API.",
      );
    }

    if (!hasCloseoutApiActorMapping(apiActorUserId)) {
      throw new Error(
        lang === "ar"
          ? "تعذر تحميل التقفيلات: معرف المستخدم غير مربوط بالخادم."
          : "Failed to load closeouts: actor user id is missing/invalid for closeouts API.",
      );
    }

    const targetStoreIds = apiTargetStoreIdsKey ? apiTargetStoreIdsKey.split("|").filter(Boolean) : [];
    if (!targetStoreIds.length) {
      throw new Error(
        lang === "ar"
          ? "تعذر تحميل التقفيلات: لا يوجد محل مربوط بالخادم لهذا السياق."
          : "Failed to load closeouts: no store id is mapped for this API context.",
      );
    }

    const fetched = await Promise.all(
      targetStoreIds.map((storeId) => fetchStoreCloseoutsViaApi({
        organizationId: closeoutsApiOrganizationId,
        actorUserId: apiActorUserId,
        actorRole: apiActorRole,
        storeId,
      })),
    );

    const merged = fetched.flatMap((items) => (Array.isArray(items) ? items : []));
    const seen = new Set();
    return merged.filter((item) => {
      const itemId = typeof item?.id === "string" ? item.id : "";
      const itemDate = typeof item?.date === "string" ? item.date : "";
      if (!itemId || !itemDate) return false;
      const key = `${itemId}:${itemDate}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [
    apiActorRole,
    apiActorUserId,
    apiTargetStoreIdsKey,
    closeoutsApiEnabled,
    closeoutsApiOrganizationId,
    closeoutsApiStrictMode,
    lang,
  ]);

  useEffect(() => {
    if (!loggedIn) return;
    if (!entriesApiEnabled) {
      if (entriesApiStrictMode) {
        setOperationalEntriesSyncError(
          lang === "ar"
            ? "مسار API للسجل التشغيلي غير مفعّل في وضع الإنتاج."
            : "Operational entries API is disabled in production mode.",
        );
      }
      return;
    }
    if (!runtimeApiStoresReady) {
      return;
    }
    loadOperationalEntriesFromApi().catch((error) => {
      console.warn("operational entries API load failed", error);
      setOperationalEntriesSyncError(
        lang === "ar"
          ? "تعذر تحديث السجل التشغيلي من الخادم."
          : "Failed to refresh operational register from server.",
      );
    });
  }, [
    employee,
    entriesApiEnabled,
    entriesApiStrictMode,
    lang,
    loadOperationalEntriesFromApi,
    loggedIn,
    runtimeApiStoresReady,
  ]);

  useEffect(() => {
    if (!operationalEntriesSyncError) return;
    console.warn(operationalEntriesSyncError);
  }, [operationalEntriesSyncError]);
  useEffect(() => {
    if (!runtimeSettingsSyncError) return;
    console.warn(runtimeSettingsSyncError);
  }, [runtimeSettingsSyncError]);
  useEffect(() => {
    if (!orgConfigSyncError) return;
    console.warn(orgConfigSyncError);
  }, [orgConfigSyncError]);

  useEffect(() => {
    if (!employee || !loggedIn) {
      setEmployeeRuntimeReady(true);
      return undefined;
    }
    if (!ORG_CONFIG_API_ENABLED || !sessionUserId || !sessionOrganizationId) {
      setEmployeeRuntimeReady(true);
      return undefined;
    }
    let cancelled = false;
    setEmployeeRuntimeReady(false);
    loadEmployeeRuntimeContextFromApi({
      sessionUserId,
      sessionOrganizationId,
    })
      .then((mapped) => {
        if (cancelled || !mapped) return;
        applyOrgConfigMappedState(mapped, {
          setConfiguredBusinesses,
          setArchivedBusinessIds,
          setStoreChannelSettings,
          setStaff,
          setStoreOperationalSettings,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn("employee runtime hydration failed", error);
      })
      .finally(() => {
        if (!cancelled) setEmployeeRuntimeReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [
    employee,
    loggedIn,
    sessionOrganizationId,
    sessionUserId,
    setArchivedBusinessIds,
    setConfiguredBusinesses,
    setStaff,
    setStoreChannelSettings,
    setStoreOperationalSettings,
  ]);

  const enterPrototypeAsEmployee = () => {
    const { organizationId, defaultEmployeeLegacyId, defaultEmployeeUserId } = readPrototypeAccessAuthContext();
    const person = staff.find((item) => item.active && !item.removed)
      || (defaultEmployeeUserId
        ? {
          id: defaultEmployeeUserId,
          apiUserId: defaultEmployeeUserId,
          legacyId: defaultEmployeeLegacyId,
          active: true,
          removed: false,
          storeIds: [],
        }
        : null)
      || PROTOTYPE_DEFAULT_STAFF[0];
    if (!person?.id) return;
    completeEmployeeLogin(
      person.id,
      person.apiUserId || defaultEmployeeUserId || "",
      person,
      organizationId,
    );
  };

  const enterPrototypeAsOwner = () => {
    const { organizationId, ownerUserId } = readPrototypeAccessAuthContext();
    completeOwnerLogin(ownerUserId, organizationId);
  };

  useEffect(() => {
    if (!closeoutsApiEnabled && !entriesApiEnabled) {
      setRuntimeApiIdMaps(null);
      return;
    }
    let envStoreIdMap = {};
    let envUserIdMap = {};
    let envSalesChannelIdMap = {};
    try {
      envStoreIdMap = JSON.parse(process.env.NEXT_PUBLIC_CLOSEOUTS_STORE_ID_MAP || "{}");
      envUserIdMap = JSON.parse(process.env.NEXT_PUBLIC_CLOSEOUTS_USER_ID_MAP || "{}");
      envSalesChannelIdMap = JSON.parse(process.env.NEXT_PUBLIC_CLOSEOUTS_SALES_CHANNEL_ID_MAP || "{}");
    } catch {
      envStoreIdMap = {};
      envUserIdMap = {};
      envSalesChannelIdMap = {};
    }
    const maps = buildRuntimeApiIdMaps({
      configuredBusinesses,
      staff,
      storeChannelSettings,
      envStoreIdMap,
      envUserIdMap,
      envSalesChannelIdMap,
      includeCatalogDefaults: !BINDS_TO_SERVER_AUTH,
    });
    setRuntimeApiIdMaps(patchRuntimeApiMapsForEmployeeSession(maps, {
      employee,
      loggedInEmployeeId,
      sessionUserId,
      uuidChecker: isUuid,
    }));
  }, [closeoutsApiEnabled, configuredBusinesses, employee, entriesApiEnabled, loggedInEmployeeId, sessionUserId, staff, storeChannelSettings]);

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
      onReviewCloseoutInApi={syncReviewCloseoutToApi}
      loadCloseoutsFromApi={
        closeoutsApiEnabled
        && closeoutsApiOrganizationId
        && runtimeApiStoresReady
          ? loadCloseoutsFromApi
          : null
      }
      closeoutReviewRequiredForStore={closeoutReviewEnabledForBusiness}
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
          <div className="taq-scroll relative min-h-0 overflow-y-auto overscroll-y-contain">{employee && !activeEmployee && <section className="px-5 pb-24"><div className="rounded-3xl bg-white p-8 text-center text-sm font-bold text-[#827762] ring-1 ring-black/[0.045]">{text(lang, "noActiveEmployee")}</div></section>}{employee && activeEmployee && employeePage === "closeouts" && <EmployeeCloseoutsView lang={lang} employee={activeEmployee} employeeRuntimeReady={employeeRuntimeReady} currentStore={currentEmployeeBusiness} assignedStores={assignedEmployeeBusinesses} onSelectStore={setEmployeeBusinessId} salesChannels={currentEmployeeChannelConfig.channels.filter((channel) => currentEmployeeChannelConfig.activeIds.includes(channel.id) && !channel.retired).map((channel) => ({ ...channel, displayName: channelName(channel, lang) }))} notebookTheme={employeeNotebookTheme} reviewWorkflowEnabled={closeoutReviewEnabledForBusiness(currentEmployeeBusiness?.id)} employeeHistoryVisibility={currentEmployeeOperationalConfig.employeeHistoryVisibility || "all"} formatCalendarDate={formatCalendarDate} channelLabel={(channel) => channel.displayName || channelName(channel, lang)} settingsPanel={({ onBack }) => <EmployeeSettingsScreen lang={lang} onBack={onBack} currentStore={currentEmployeeBusiness} assignedStores={assignedEmployeeBusinesses} onSelectStore={setEmployeeBusinessId} employeeNotebookTheme={employeeThemeOverride || readEmployeeNotebookTheme(activeEmployee.id) || employeeNotebookTheme} setEmployeeNotebookTheme={(theme) => { writeEmployeeNotebookTheme(activeEmployee.id, theme); setEmployeeThemeOverride(theme); }} onOpenSupport={() => openWhatsAppSupport(lang)} onOpenHelp={() => setHelpOpen(true)} />} onEntryActiveChange={setEmployeeEntryActive} onRegisterAdd={(handler) => { employeeAddHandlerRef.current = handler || (() => {}); }} onRegisterSettingsOpener={(handler) => { employeeSettingsOpenerRef.current = handler || (() => {}); }} saving={saving} trustServerDaySequenceOnly={CLOSEOUTS_API_DB_SOURCE} />}{!employee && ownerPage === "closeouts" && <EmployeeCloseoutsView lang={lang} employee={ownerCloseoutActor} employeeRuntimeReady={runtimeApiStoresReady} currentStore={ownerCloseoutBusiness} assignedStores={activeBusinesses} onSelectStore={setSelectedBusiness} salesChannels={ownerCloseoutChannelConfig.channels.filter((channel) => ownerCloseoutChannelConfig.activeIds.includes(channel.id) && !channel.retired).map((channel) => ({ ...channel, displayName: channelName(channel, lang) }))} notebookTheme={notebookTheme} reviewWorkflowEnabled={closeoutReviewEnabledForBusiness(ownerCloseoutBusiness?.id)} employeeHistoryVisibility="all" formatCalendarDate={formatCalendarDate} channelLabel={(channel) => channel.displayName || channelName(channel, lang)} onRegisterAdd={(handler) => { ownerAddHandlerRef.current = handler || (() => {}); }} onEntryActiveChange={setOwnerEntryActive} saving={saving} trustServerDaySequenceOnly={CLOSEOUTS_API_DB_SOURCE} pageTitle={lang === "ar" ? "تسجيل تقفيلة" : "Record closeout"} onCloseoutSubmitted={() => setOwnerPage("home")} />}{!employee && ownerPage === "home" && <NotebookScrollSurface theme={notebookTheme} lang={lang}><OwnerHomeConnected lang={lang} operationalEntries={operationalEntries} operationalEntriesLoading={operationalEntriesLoading} duplicateSalesAlerts={duplicateSalesAlerts} closeoutAlerts={unseenCloseoutAlerts} closeoutReviewEnabledForBusiness={closeoutReviewEnabledForBusiness} onViewPendingCloseouts={(closeout) => { setOwnerReviewCloseout(closeout); setSelectedBusiness(closeout.storeId); }} onReviewCloseout={reviewCloseoutAlert} onDismissCloseout={dismissCloseoutAlert} onReviewDuplicate={reviewDuplicateSales} onAcknowledgeDuplicate={acknowledgeDuplicateSales} reviewEnabledForBusiness={reviewEnabledForBusiness} onOpenOperation={handleOpenOwnerOperation} onShareNotebook={setShareSnapshot} notebookTheme={notebookTheme} selectedBusiness={activeViewBusiness} setSelectedBusiness={setSelectedBusiness} reviewEnabled={ownerReviewEnabled} businessesList={activeBusinesses} summaryApiEnabled={entriesApiEnabled} summaryApiOrganizationId={closeoutsApiOrganizationId} summaryApiActorUserId={ownerApiUserId} summaryApiActorRole="owner" summaryRefreshKey={summaryRefreshKey} /></NotebookScrollSurface>}{!employee && ownerPage === "add-summary" && !ENTRIES_API_DB_SOURCE && <OwnerSummaryScreen lang={lang} saving={saving} selectedBusiness={activeViewBusiness} businessesList={activeBusinesses} storeChannelSettings={storeChannelSettings} onBack={() => setOwnerPage("home")} onSave={saveOwnerSummary} />}{!employee && ownerPage === "add-expense" && !ENTRIES_API_DB_SOURCE && <OwnerExpenseScreen lang={lang} saving={saving} selectedBusiness={activeViewBusiness} businessesList={activeBusinesses} storeOperationalSettings={storeOperationalSettings} onBack={() => setOwnerPage("home")} onSave={saveOwner} />}{!employee && ownerPage === "reports" && <NotebookScrollSurface theme={notebookTheme} lang={lang}><ReportsScreen lang={lang} operationalEntries={operationalEntries} operationalEntriesLoading={operationalEntriesLoading} archivedReadOnlyBusinessId={archivedReadOnlyBusinessId} reviewEnabledForBusiness={reviewEnabledForBusiness} onShareNotebook={setShareSnapshot} notebookTheme={notebookTheme} setNotebookTheme={setNotebookTheme} selectedBusiness={selectedBusiness} setSelectedBusiness={setSelectedBusiness} configuredChannels={reportChannelConfig.channels} reviewEnabled={ownerReviewEnabled} businessesList={reportingBusinesses} archivedBusinessIds={archivedBusinessIds} reportsApiEnabled={entriesApiEnabled} reportsApiOrganizationId={closeoutsApiOrganizationId} reportsApiActorUserId={ownerApiUserId} reportsApiActorRole="owner" summaryRefreshKey={summaryRefreshKey} /></NotebookScrollSurface>}{!employee && ownerPage === "register" && <OwnerRegisterConnected lang={lang} onOpenOperation={handleOpenOwnerOperation} reviewFocus={duplicateReviewFocus} attachmentReviewRequest={attachmentReviewRequest} archivedReadOnlyBusinessId={archivedReadOnlyBusinessId} operationalEntries={operationalEntries} selectedBusiness={selectedBusiness} setSelectedBusiness={setSelectedBusiness} businessesList={reportingBusinesses} archivedBusinessIds={archivedBusinessIds} notebookTheme={notebookTheme} registerEntriesApiEnabled={entriesApiEnabled && REGISTER_ENTRIES_PAGINATION_ENABLED} registerEntriesApiOrganizationId={closeoutsApiOrganizationId} registerEntriesApiActorUserId={ownerApiUserId} registerEntriesApiActorRole="owner" registerEntriesRefreshKey={summaryRefreshKey} />}{!employee && ownerPage === "settings" && <OwnerSettingsScreen lang={lang} operationalEntries={operationalEntries} selectedBusiness={selectedBusiness} setSelectedBusiness={setSelectedBusiness} setOwnerPage={setOwnerPage} setArchivedReadOnlyBusinessId={setArchivedReadOnlyBusinessId} setLastCloseoutDates={setLastCloseoutDates} notebookTheme={notebookTheme} setNotebookTheme={setNotebookTheme} employeePreferences={employeePreferences} ownerShellPreferences={ownerShellPreferences} storeChannelSettings={storeChannelSettings} setStoreChannelSettings={setStoreChannelSettings} storeOperationalSettings={storeOperationalSettings} setStoreOperationalSettings={setStoreOperationalSettings} configuredBusinesses={configuredBusinesses} setConfiguredBusinesses={setConfiguredBusinesses} archivedBusinessIds={archivedBusinessIds} setArchivedBusinessIds={setArchivedBusinessIds} staff={staff} setStaff={setStaff} ownerProfile={ownerProfile} setOwnerProfile={setOwnerProfile} authOwnerUsername={authOwnerUsername} setAuthOwnerUsername={setAuthOwnerUsername} authOwnerPassword={authOwnerPassword} setAuthOwnerPassword={setAuthOwnerPassword} authEmployeePins={authEmployeePins} setAuthEmployeePins={setAuthEmployeePins} onPersistSettingsNow={persistRuntimeSettingsNow} onLogout={logout} onOpenSupport={() => openWhatsAppSupport(lang)} onOpenHelp={() => setHelpOpen(true)} />}{saved && <div className="sticky bottom-4 left-4 right-4 z-30 mx-auto max-w-md rounded-2xl bg-[#112A46] p-4 text-xs font-bold text-white">{text(lang, "savedNotice")}</div>}
          </div>
          {!(employee && employeeEntryActive) && !(!employee && ownerEntryActive) && <BottomNav lang={lang} employee={employee} active={employee ? employeePage : ownerPage} onAdd={() => { if (employee) employeeAddHandlerRef.current?.(); else handleOwnerQuickAddOpen(); }} onChange={(page) => { setQuickAddOpen(false); if (employee) changeEmployeePage(page); else changeOwnerPage(page); }} />}{!employee && <QuickAddSheet lang={lang} employee={false} open={quickAddOpen} onClose={() => setQuickAddOpen(false)} onSummary={handleOpenQuickAddSummary} onExpense={handleOpenQuickAddExpense} />}<OperationModal lang={lang} item={selected} onClose={() => setSelected(null)} onReview={confirmReview} onVoid={requestVoidOperation} onRestore={requestRestoreOperation} reviewEnabled={selectedOperationReviewEnabled} canVoid={Boolean(selected) && !archivedBusinessIds.includes(selected?.businessId)} canRestore={Boolean(selected) && !archivedBusinessIds.includes(selected?.businessId)} /><DuplicateSalesDialog lang={lang} draft={pendingDuplicateSummary?.payload || null} previousEntries={pendingDuplicateSummary?.previousEntries || []} businessesList={activeBusinesses} onCancel={() => setPendingDuplicateSummary(null)} onConfirm={confirmDuplicateSummary} /><VoidOperationDialog lang={lang} item={voidTarget} onCancel={() => setVoidTarget(null)} onConfirm={confirmVoidOperation} /><RestoreOperationDialog lang={lang} item={restoreTarget} onCancel={() => setRestoreTarget(null)} onConfirm={confirmRestoreOperation} /><SavedOutflowShareDialog lang={lang} item={savedOutflowShareTarget} businessesList={activeBusinesses} onClose={() => setSavedOutflowShareTarget(null)} /><NotebookShareModal lang={lang} snapshot={shareSnapshot} onClose={() => setShareSnapshot(null)} businessesList={reportingBusinesses} operationalEntries={operationalEntries} archivedBusinessIds={archivedBusinessIds} notebookExportApiEnabled={phase9ApiEnabled && entriesApiEnabled} notebookExportAuth={runtimeApiAuth} />
          <OwnerCloseoutModals
            lang={lang}
            ownerReviewCloseout={ownerReviewCloseout}
            returnCloseoutTarget={returnCloseoutTarget}
            ownerDisplayName={ownerDisplayName}
            reviewWorkflowEnabled={ownerReviewCloseout ? closeoutReviewEnabledForBusiness(ownerReviewCloseout.storeId) : false}
            ownerNotebookTheme={notebookTheme}
            resolveSalesChannels={resolveStoreSalesChannels}
            channelLabel={(channel) => channel.displayName || channelName(channel, lang)}
            onCloseoutUpdated={handleOwnerCloseoutUpdated}
            onCloseoutDeleted={handleOwnerCloseoutDeleted}
            onCloseReview={() => { setOwnerReviewCloseout(null); setReturnCloseoutTarget(null); }}
            onRequestReturn={(closeout) => { setReturnCloseoutTarget(closeout); setOwnerReviewCloseout(null); }}
          />
          <HelpCenterSheet lang={lang} open={helpOpen} onClose={() => setHelpOpen(false)} />
        </div>
      </main>
    </div>
    </DailyCloseoutsProvider>
  );
}

