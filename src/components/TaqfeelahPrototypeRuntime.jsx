"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PROTOTYPE_BUILD_STAMP } from "@/prototype-build-stamp.mjs";
import { DailyCloseoutsProvider, useDailyCloseouts } from "@/features/daily-closeouts/DailyCloseoutsProvider";
import { buildOperationalEntriesFromCloseout } from "@/features/daily-closeouts/daily-closeouts-demo-store";
import { autoResolveSubmittedCloseoutsWithoutReview, readDailyCloseouts } from "@/features/daily-closeouts/daily-closeouts-demo-store";
import { readCloseoutEvents } from "@/features/daily-closeouts/daily-closeouts-demo-store";
import { applyNotebookThemeCssVariables, isValidNotebookTheme, notebookCardBackground, notebookLinesBackground, notebookThemes, resolveNotebookTheme } from "@/features/daily-closeouts/notebook-themes";
import { BackTitle, Badge, FinancialRows, InkTab, MoneyValue, NotebookInk, NotebookRow, NumberLine } from "@/features/daily-closeouts/NotebookAtoms";
import ThemePicker from "@/features/daily-closeouts/ThemePicker";
import { shareImageThroughWhatsApp } from "@/features/daily-closeouts/notebook-image-sharing";
import EmployeeCloseoutsView from "@/features/employee-closeouts/EmployeeCloseoutsView";
import DailyCloseoutEntryFlow from "@/features/employee-closeouts/DailyCloseoutEntryFlow";
import EmployeeHistoryVisibilityPicker from "@/features/employee-closeouts/EmployeeHistoryVisibilityPicker";
import { employeeHistoryVisibilityLabel } from "@/features/employee-closeouts/employee-closeout-history";
import EmployeeFooterNav from "@/features/employee-closeouts/EmployeeFooterNav";
import { readEmployeeNotebookTheme, writeEmployeeNotebookTheme } from "@/features/employee-closeouts/employee-theme-storage";
import PendingCloseoutsNotice from "@/features/owner-closeout-review/PendingCloseoutsNotice";
import OwnerCloseoutReviewPanel from "@/features/owner-closeout-review/OwnerCloseoutReviewPanel";
import ReturnCloseoutModal from "@/features/owner-closeout-review/ReturnCloseoutModal";
import NotebookScrollSurface from "@/features/daily-closeouts/NotebookScrollSurface";
import LanHintBanner from "@/features/demo/LanHintBanner";
import { clearAuthSession, clearEmployeeCredentials, clearOwnerCredentials, readEmployeeCredentials, readOwnerCredentials, resolveAuthStateFromSession, saveAuthSession, saveEmployeeCredentials, saveOwnerCredentials } from "@/features/demo/login-credentials-storage";
import { readLocalStorageJson } from "@/features/demo/prototype-storage";
import AttachmentLightbox from "./AttachmentLightbox";
import AttachmentPreview from "@/components/AttachmentPreview";
import { makeAttachment, prepareAttachment, readAttachmentPayload, storeAttachmentPayload, deleteAttachmentPayload, stripEmbeddedAttachmentImages, useAttachmentSource, useAttachmentCapture } from "@/features/entries/client/attachment-storage";
import {
  createPrototypeMonthDemoOperationalEntries,
  PROTOTYPE_DEMO_LAST_CLOSEOUT_KEY,
  PROTOTYPE_DEMO_OPERATIONAL_ENTRIES_KEY,
} from "@/features/demo/prototype-month-demo-seed";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Building2,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CreditCard,
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
  Home,
  Plus,
  ReceiptText,
  Send,
  Share2,
  Settings,
  ShoppingBag,
  Smartphone,
  UserRound,
  Wallet,
  Trash2,
  X,
} from "lucide-react";
import { getEnabledOwnerLoginMethods, isOwnerLoginMethodEnabled } from "@/core/auth/owner-login-methods";
import { useOperationalEntriesApi } from "@/features/entries/client/useOperationalEntriesApi";
import { DEFAULT_REGISTER_LOG_FILTERS, summarizeLedgerPeriod, activeLedgerFilterCount } from "@/features/owner/ledger/owner-ledger-filters";
import {
  fetchStoreCloseoutsViaApi,
  isUuid,
  reviewCloseoutViaApi,
  submitCloseoutViaApi,
} from "@/features/closeouts/client/closeouts-api-client";
import {
  createStoreEntryViaApi,
  fetchStoreEntriesViaApi,
  restoreStoreEntryViaApi,
  reviewStoreEntryViaApi,
  voidStoreEntryViaApi,
} from "@/features/entries/client/store-entries-api-client";
import {
  fetchEmployeeLoginRosterViaApi,
  fetchRuntimeSettingsViaApi,
  getSessionStatusViaApi,
  loginEmployeeSessionViaApi,
  loginOwnerSessionViaApi,
  logoutSessionViaApi,
  saveRuntimeSettingsViaApi,
} from "@/features/runtime-settings/client/runtime-session-and-settings-api-client";
import { isProductionAppMode } from "@/core/config/app-mode";
import OwnerSettingsScreen from "@/features/owner/OwnerSettingsScreen";
import { OwnerHome, OwnerCloseoutModals, OwnerHomeConnected, OwnerRegisterConnected, StoreScopeTabs, QuickAddSheet, BottomNav, DayAttachments, RegisterFiltersSheet, LogStoreFilter, NotebookDateBar, OutflowAnalysis, LogFilterChip } from "@/features/owner/OwnerHomeScreen";
import { OperationModal, DuplicateSalesDialog, VoidOperationDialog, RestoreOperationDialog } from "@/features/entries/client/EntryDialogs";
import OwnerRegisterScreen from "@/features/owner/OwnerRegisterScreen";
import { DateSelector, StoreComparison, NotebookHeading, NotebookMarginTools } from "@/features/owner/OwnerRegisterScreen";
import NotebookShareModal from "@/features/owner/NotebookShareModal";
import { SavedOutflowShareDialog } from "@/features/owner/NotebookShareModal";
import ReportsScreen from "@/features/owner/ReportsScreen";
import { businessName, businessLocation, businessRecord, money, channelName, expenseCategories, outflowReportCategories, emptyStoreRecord, businesses, opDate, opTime, auditDateTime, employeeName, fullDate, shortDate, formatCalendarDate, formatCalendarMonth, todayIsoDate, nextDayIso, isoCalendarDate, signedEntryAmount, entryWasRestored, entryCategory, noteLabel, operationDisplayLabel, newestEntries, attachmentsFromEntries } from "@/utils/display-helpers";
import { getStoreChannelConfig, getStoreOperationalConfig, buildInitialStoreChannelSettings, buildInitialStoreOperationalSettings } from "@/features/owner/store-config-helpers";
import copy from "@/i18n/copy";

import { useSavedNotice } from "@/hooks/useSavedNotice";
import Logo from "@/components/ui/Logo";
import LanguageSwitch from "@/components/ui/LanguageSwitch";
import LoginScreen from "@/features/auth/client/LoginScreen";
import EmployeeLoginScreen from "@/features/auth/client/EmployeeLoginScreen";

function AppFontStyles() {
  return (
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@700&family=Caveat:wght@700&family=Noto+Sans:wght@400;500;600;700;800&family=Noto+Sans+Arabic:wght@400;500;600;700;800&display=swap');
      .taq-notch { display: none !important; }
      .taq-shell { width: 100% !important; max-width: none !important; min-height: 100dvh !important; border: none !important; border-radius: 0 !important; box-shadow: none !important; }
      .taq-screen { height: 100dvh !important; max-height: 100dvh !important; min-height: 100dvh !important; display: grid !important; grid-template-rows: auto 1fr auto !important; overflow: hidden !important; }
      .taq-scroll { min-height: 0 !important; -webkit-overflow-scrolling: touch; }
      .taq-owner-nav { position: relative !important; bottom: auto !important; left: auto !important; right: auto !important; transform: none !important; width: 100% !important; max-width: none !important; border-radius: 0 !important; box-shadow: none !important; }
      .taq-notebook-surface .taq-notebook-content {
        box-sizing: border-box;
        padding-inline-start: calc(2rem + 1.25px + 14px);
        padding-inline-end: 14px;
        max-width: 100%;
      }
      .taq-notebook-surface .taq-owner-page.taq-notebook-body {
        width: 100%;
        max-width: none;
        margin-inline: 0;
        padding-inline: 0 !important;
      }
      @media (min-width: 640px) and (max-width: 1023px) {
        .taq-topbar { max-width: 540px; margin-inline: auto; }
        .taq-owner-page { max-width: 530px; margin-inline: auto; padding-inline: 0 !important; }
        .taq-scroll > section:not(.taq-owner-page) { max-width: 560px; margin-inline: auto; }
        .taq-notebook-margin { inset-inline-start: calc((100% - 530px) / 2 + 32px) !important; }
      }
      @media (min-width: 1024px) {
        .taq-topbar { max-width: 560px; margin-inline: auto; }
        .taq-owner-page { max-width: 540px; margin-inline: auto; padding-inline: 0 !important; }
        .taq-scroll > section:not(.taq-owner-page) { max-width: 560px; margin-inline: auto; }
        .taq-notebook-margin { inset-inline-start: calc((100% - 540px) / 2 + 32px) !important; }
      }
    `}</style>
  );
}


const channels = [
  { id: "cash", text: "cash", icon: Wallet },
  { id: "mada", text: "mada", icon: CreditCard },
  { id: "apple", text: "apple", icon: Smartphone },
  { id: "jahez", text: "jahez", icon: ShoppingBag },
  { id: "hunger", text: "hunger", icon: ShoppingBag },
];

function monthSelectionParts(value) {
  const normalized = monthSelectionValue(value);
  const [year, month] = normalized.split("-").map(Number);
  return { year, month: month - 1, normalized };
}
function formatSelectedMonth(value, lang) {
  const { year, month } = monthSelectionParts(value);
  return formatCalendarMonth(year, month, lang);
}











function downloadBlobFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function captureNotebookPreviewBlob(element, backgroundColor = "#FFFDF7") {
  const { captureNotebookShareBlob } = await import("@/features/daily-closeouts/notebook-share-capture");
  return captureNotebookShareBlob(element, backgroundColor);
}

/** Share image via OS sheet (WhatsApp on mobile). Never downloads — wa.me cannot attach files. */
async function shareNotebookImageToWhatsApp(file, caption, lang) {
  return shareImageThroughWhatsApp({
    file,
    caption,
    lang,
    pasteHint: text(lang, "shareImagePasteHint"),
  });
}




function formatDateTimeLabel(iso, lang) {
  if (!iso) return "";
  const datePart = iso.slice(0, 10);
  const time = new Date(iso).toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" });
  return `${formatCalendarDate(datePart, lang)} · ${time}`;
}

export default function TaqfeelahPrototypeRuntime() {
  const [lang, setLang] = useState("ar");
  const [sessionUserId, setSessionUserId] = useState("");
  const [loggedIn, setLoggedIn] = useState(() => readPrototypeAuthBoot().loggedIn);
  const [authScreen, setAuthScreen] = useState("owner");
  const [employee, setEmployee] = useState(() => readPrototypeAuthBoot().employee);
  const [loggedInEmployeeId, setLoggedInEmployeeId] = useState(() => readPrototypeAuthBoot().loggedInEmployeeId);
  const [closeoutAlerts, setCloseoutAlerts] = useState(() => readCloseoutAlerts());
  const [helpOpen, setHelpOpen] = useState(false);
  const [employeePage, setEmployeePage] = useState("closeouts");
  const [ownerReviewCloseout, setOwnerReviewCloseout] = useState(null);
  const [returnCloseoutTarget, setReturnCloseoutTarget] = useState(null);
  const [employeeThemeOverride, setEmployeeThemeOverride] = useState(() => {
    const boot = readPrototypeAuthBoot();
    return boot.employee && boot.loggedInEmployeeId ? readEmployeeNotebookTheme(boot.loggedInEmployeeId) : null;
  });
  const employeeAddHandlerRef = useRef(() => {});
  const employeeSettingsOpenerRef = useRef(() => {});
  const [employeeEntryActive, setEmployeeEntryActive] = useState(false);
  const [ownerPage, setOwnerPage] = useState("home");
  const [selected, setSelected] = useState(null);
  const [voidTarget, setVoidTarget] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [savedOutflowShareTarget, setSavedOutflowShareTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [pendingDuplicateSummary, setPendingDuplicateSummary] = useState(null);
  const [duplicateReviewFocus, setDuplicateReviewFocus] = useState(null);
  const [attachmentReviewRequest, setAttachmentReviewRequest] = useState(null);
  const [saved, showSaved] = useSavedNotice();
  const [operationalEntries, setOperationalEntries] = useState(() => readOperationalEntries());
  const [operationalEntriesSyncError, setOperationalEntriesSyncError] = useState("");
  const [acknowledgedDuplicateSales, setAcknowledgedDuplicateSales] = useState(() => readAcknowledgedDuplicateSales());
  const [notebookTheme, setNotebookTheme] = useState(() => { if (typeof window === "undefined") return "yellow"; return window.localStorage.getItem("taqfeelah_notebook_theme") || "yellow"; });
  const [selectedBusiness, setSelectedBusiness] = useState("all");
  const [shareSnapshot, setShareSnapshot] = useState(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [archivedReadOnlyBusinessId, setArchivedReadOnlyBusinessId] = useState(null);
  const initialSettings = readSavedSettings();
  const initialAuthConfig = initialSettings?.authConfig || {};
  const initialBusinesses = initialSettings?.configuredBusinesses || (APP_IN_PRODUCTION_MODE ? [] : businesses);
  const [configuredBusinesses, setConfiguredBusinesses] = useState(initialBusinesses);
  const [archivedBusinessIds, setArchivedBusinessIds] = useState(initialSettings?.archivedBusinessIds || initialSettings?.archivedStores || []);
  const [staff, setStaff] = useState(initialSettings?.staff || (APP_IN_PRODUCTION_MODE ? [] : PROTOTYPE_DEFAULT_STAFF));
  const [ownerProfile, setOwnerProfile] = useState(initialSettings?.ownerProfile || { name: "محمد الهاجري" });
  const currentOwnerActor = { ...ownerActor, nameAr: ownerProfile.name, nameEn: ownerProfile.name };
  const [storeChannelSettings, setStoreChannelSettings] = useState(() => buildInitialStoreChannelSettings(initialSettings, initialBusinesses));
  const [storeOperationalSettings, setStoreOperationalSettings] = useState(() => buildInitialStoreOperationalSettings(initialSettings, initialBusinesses));
  const [authOwnerUsername, setAuthOwnerUsername] = useState(() => initialAuthConfig.ownerUsername || PROTOTYPE_OWNER_USERNAME || "hajri");
  const [authOwnerPassword, setAuthOwnerPassword] = useState(() => initialAuthConfig.ownerPassword || PROTOTYPE_OWNER_PASSWORD || "123");
  const [authEmployeePins, setAuthEmployeePins] = useState(() => (initialAuthConfig.employeePins && typeof initialAuthConfig.employeePins === "object" ? initialAuthConfig.employeePins : {}));
  const [lastCloseoutDates, setLastCloseoutDates] = useState(() => readDemoLastCloseoutDates());
  const [employeeBusinessId, setEmployeeBusinessId] = useState(() => readPrototypeAuthBoot().employeeBusinessId);
  const runtimeSettingsHydratedRef = useRef(!APP_IN_PRODUCTION_MODE);
  const runtimeSettingsSyncTimerRef = useRef(null);
  const runtimeSettingsLastSavedSignatureRef = useRef("");
  const [runtimeSettingsSyncError, setRuntimeSettingsSyncError] = useState("");
  useEffect(() => {
    if (!APP_IN_PRODUCTION_MODE) return;
    let cancelled = false;
    getSessionStatusViaApi()
      .then((session) => {
        if (cancelled || !session?.authenticated) return;
        setSessionUserId(typeof session.userId === "string" ? session.userId : "");
        setLoggedIn(true);
        setAuthScreen("owner");
        if (session.role === "employee") {
          setEmployee(true);
          setLoggedInEmployeeId(session.userId);
          setEmployeePage("closeouts");
          return;
        }
        setEmployee(false);
        setLoggedInEmployeeId(null);
        setOwnerPage("home");
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn("session bootstrap failed", error);
        setSessionUserId("");
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!APP_IN_PRODUCTION_MODE || !employee || !sessionUserId) return;
    const matchedStaff = staff.find(
      (person) => person.apiUserId === sessionUserId || person.id === loggedInEmployeeId,
    );
    if (matchedStaff?.id && matchedStaff.id !== loggedInEmployeeId) {
      setLoggedInEmployeeId(matchedStaff.id);
    }
  }, [employee, loggedInEmployeeId, sessionUserId, staff]);
  const activeBusinesses = configuredBusinesses.filter((business) => !archivedBusinessIds.includes(business.id));
  const reportingBusinesses = configuredBusinesses;
  const activeViewBusiness = activeBusinesses.length === 1 ? activeBusinesses[0].id : selectedBusiness === "all" || activeBusinesses.some((business) => business.id === selectedBusiness) ? selectedBusiness : "all";
  const activeEmployee = useMemo(
    () => employee && loggedInEmployeeId
      ? staff.find((person) => (person.id === loggedInEmployeeId || person.apiUserId === loggedInEmployeeId) && person.active && !person.removed) || null
      : null,
    [employee, loggedInEmployeeId, staff],
  );
  const assignedEmployeeBusinesses = useMemo(
    () => activeBusinesses.filter((business) => (activeEmployee?.storeIds || []).includes(business.id)),
    [activeBusinesses, activeEmployee],
  );
  const currentEmployeeBusiness = useMemo(
    () => assignedEmployeeBusinesses.find((business) => business.id === employeeBusinessId) || assignedEmployeeBusinesses[0] || null,
    [assignedEmployeeBusinesses, employeeBusinessId],
  );
  const currentEmployeeChannelConfig = getStoreChannelConfig(storeChannelSettings, currentEmployeeBusiness?.id);
  const currentEmployeeOperationalConfig = getStoreOperationalConfig(storeOperationalSettings, currentEmployeeBusiness?.id);
  const resolveStoreSalesChannels = useCallback((storeId) => {
    const channelConfig = getStoreChannelConfig(storeChannelSettings, storeId);
    return channelConfig.channels
      .filter((channel) => channelConfig.activeIds.includes(channel.id) && !channel.retired)
      .map((channel) => ({ ...channel, displayName: channelName(channel, lang) }));
  }, [storeChannelSettings, lang]);
  const currentEmployeeCategories = expenseCategories.filter((item) => currentEmployeeOperationalConfig.activeCategories.includes(item.id));
  const activeOwnerStoreId = activeViewBusiness === "all" ? activeBusinesses[0]?.id : activeViewBusiness;
  const reportSettingsStoreId = archivedReadOnlyBusinessId || activeOwnerStoreId;
  const reportChannelConfig = getStoreChannelConfig(storeChannelSettings, reportSettingsStoreId);
  const reviewEnabledForBusiness = (businessId) => getStoreOperationalConfig(storeOperationalSettings, businessId).reviewEnabled;
  const closeoutReviewEnabledForBusiness = (businessId) => Boolean(getStoreOperationalConfig(storeOperationalSettings, businessId).closeoutReviewEnabled);
  const employeeNotebookTheme = resolveNotebookTheme({
    storeOperationalSettings,
    storeId: currentEmployeeBusiness?.id,
    globalTheme: notebookTheme,
    employeeThemeOverride: employeeThemeOverride || (activeEmployee ? readEmployeeNotebookTheme(activeEmployee.id) : null),
  });
  const attachmentAlertEnabledForBusiness = (businessId) => { const config = getStoreOperationalConfig(storeOperationalSettings, businessId); return config.reviewEnabled && config.attachmentAlert; };
  const closeoutAlertEnabledForBusiness = (businessId) => getStoreOperationalConfig(storeOperationalSettings, businessId).closeoutAlert;
  const ownerReviewEnabled = activeViewBusiness === "all" ? activeBusinesses.some((business) => reviewEnabledForBusiness(business.id)) : reviewEnabledForBusiness(activeOwnerStoreId);
  const selectedOperationReviewEnabled = selected ? reviewEnabledForBusiness(selected.businessId) && !archivedBusinessIds.includes(selected.businessId) : ownerReviewEnabled;
  const runtimeSettingsSnapshot = useMemo(() => ({
    configuredBusinesses,
    archivedBusinessIds,
    storeChannelSettings,
    storeOperationalSettings,
    notebookTheme,
    staff,
    ownerProfile,
    authConfig: {
      ownerUsername: authOwnerUsername,
      ownerPassword: authOwnerPassword,
      employeePins: authEmployeePins,
    },
  }), [
    configuredBusinesses,
    archivedBusinessIds,
    storeChannelSettings,
    storeOperationalSettings,
    notebookTheme,
    staff,
    ownerProfile,
    authOwnerUsername,
    authOwnerPassword,
    authEmployeePins,
  ]);

  const applyRuntimeSettingsSnapshot = useCallback((rawSettings, isEmployeeSession = false) => {
    const migrated = migrateSavedSettings(rawSettings);
    if (!migrated || typeof migrated !== "object") return;
    if (Array.isArray(migrated.configuredBusinesses)) setConfiguredBusinesses(migrated.configuredBusinesses);
    if (Array.isArray(migrated.archivedBusinessIds)) setArchivedBusinessIds(migrated.archivedBusinessIds);
    if (migrated.storeChannelSettings && typeof migrated.storeChannelSettings === "object") {
      setStoreChannelSettings(migrated.storeChannelSettings);
    }
    if (migrated.storeOperationalSettings && typeof migrated.storeOperationalSettings === "object") {
      setStoreOperationalSettings(migrated.storeOperationalSettings);
    }
    if (typeof migrated.notebookTheme === "string" && isValidNotebookTheme(migrated.notebookTheme)) {
      setNotebookTheme(migrated.notebookTheme);
    }
    if (Array.isArray(migrated.staff)) setStaff(migrated.staff);
    if (migrated.ownerProfile && typeof migrated.ownerProfile === "object") setOwnerProfile(migrated.ownerProfile);
    // authConfig (credentials) only applied to owner sessions — server already redacts for employees
    if (!isEmployeeSession && migrated.authConfig && typeof migrated.authConfig === "object") {
      if (typeof migrated.authConfig.ownerUsername === "string" && migrated.authConfig.ownerUsername.trim()) {
        setAuthOwnerUsername(migrated.authConfig.ownerUsername.trim());
      }
      if (typeof migrated.authConfig.ownerPassword === "string" && migrated.authConfig.ownerPassword.trim()) {
        setAuthOwnerPassword(migrated.authConfig.ownerPassword);
      }
      if (migrated.authConfig.employeePins && typeof migrated.authConfig.employeePins === "object") {
        setAuthEmployeePins(migrated.authConfig.employeePins);
      }
    }
  }, []);

  const persistRuntimeSettingsNow = useCallback(async (partialSettings = {}) => {
    if (!APP_IN_PRODUCTION_MODE) return null;
    const settings = {
      ...runtimeSettingsSnapshot,
      ...partialSettings,
      authConfig: {
        ...runtimeSettingsSnapshot.authConfig,
        ...(partialSettings.authConfig && typeof partialSettings.authConfig === "object" ? partialSettings.authConfig : {}),
      },
    };
    const saved = await saveRuntimeSettingsViaApi({
      settings,
      reason: "owner_settings_explicit_save",
    });
    if (saved?.settings && typeof saved.settings === "object") {
      applyRuntimeSettingsSnapshot(saved.settings, false);
      try {
        runtimeSettingsLastSavedSignatureRef.current = JSON.stringify(saved.settings);
      } catch {
        runtimeSettingsLastSavedSignatureRef.current = "";
      }
    }
    return saved;
  }, [applyRuntimeSettingsSnapshot, runtimeSettingsSnapshot]);

  const duplicateSalesAlerts = useMemo(() => {
    const grouped = new Map();
    operationalEntries.filter((entry) => entry.type === "summary" && entryIsActive(entry) && activeBusinesses.some((business) => business.id === entry.businessId)).forEach((entry) => {
      const key = `${entry.businessId}|${entry.date}`;
      if (!grouped.has(key)) grouped.set(key, { businessId: entry.businessId, date: entry.date, entries: [] });
      grouped.get(key).entries.push(entry);
    });
    return [...grouped.values()].filter((group) => group.entries.length > 1 && acknowledgedDuplicateSales[duplicateSalesGroupKey(group)] !== duplicateSalesSignature(group.entries)).sort((a, b) => b.date.localeCompare(a.date));
  }, [operationalEntries, activeBusinesses, acknowledgedDuplicateSales]);
  const pendingAttachmentReviews = newestEntries(operationalEntries.filter((entry) => activeBusinesses.some((business) => business.id === entry.businessId) && entryIsActive(entry) && entryHasAttachment(entry) && !entry.reviewed && attachmentAlertEnabledForBusiness(entry.businessId)));
  const firstPendingAttachmentReview = pendingAttachmentReviews[0] || null;
  const ownerHasPendingReview = pendingAttachmentReviews.length > 0;
  const unseenCloseoutAlerts = closeoutAlerts.filter((alert) => !alert.seen && closeoutAlertEnabledForBusiness(alert.businessId));
  const ownerNotificationsVisible = duplicateSalesAlerts.length > 0 || ownerHasPendingReview || unseenCloseoutAlerts.length > 0;
  const ownerNotificationBadge = ownerHasPendingReview || duplicateSalesAlerts.length > 0 || unseenCloseoutAlerts.length > 0;
  useEffect(() => { if (typeof window !== "undefined") window.localStorage.setItem("taqfeelah_notebook_theme", notebookTheme); }, [notebookTheme]);
  useEffect(() => {
    applyNotebookThemeCssVariables(employee ? employeeNotebookTheme : notebookTheme);
  }, [employee, employeeNotebookTheme, notebookTheme]);
  useEffect(() => {
    if (APP_IN_PRODUCTION_MODE || typeof window === "undefined") return;
    window.localStorage.setItem(OPERATIONAL_ENTRIES_STORAGE_KEY, JSON.stringify(stripEmbeddedAttachmentImages(operationalEntries)));
  }, [operationalEntries]);
  useEffect(() => {
    if (APP_IN_PRODUCTION_MODE || typeof window === "undefined") return;
    window.localStorage.setItem(ACKNOWLEDGED_DUPLICATE_SALES_STORAGE_KEY, JSON.stringify(acknowledgedDuplicateSales));
  }, [acknowledgedDuplicateSales]);
  useEffect(() => {
    if (APP_IN_PRODUCTION_MODE || typeof window === "undefined") return;
    window.localStorage.setItem(LAST_CLOSEOUT_STORAGE_KEY, JSON.stringify(lastCloseoutDates));
  }, [lastCloseoutDates]);
  useEffect(() => {
    if (!APP_IN_PRODUCTION_MODE || !loggedIn) return;
    let cancelled = false;
    fetchRuntimeSettingsViaApi()
      .then((payload) => {
        if (cancelled) return;
        if (payload?.settings && typeof payload.settings === "object") {
          applyRuntimeSettingsSnapshot(payload.settings, employee);
          if (!employee) {
            try {
              runtimeSettingsLastSavedSignatureRef.current = JSON.stringify(payload.settings);
            } catch {
              runtimeSettingsLastSavedSignatureRef.current = "";
            }
          }
        }
        runtimeSettingsHydratedRef.current = true;
        setRuntimeSettingsSyncError("");
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn("runtime settings load failed", error);
        setRuntimeSettingsSyncError(
          lang === "ar"
            ? "تعذر تحميل إعدادات التشغيل من الخادم."
            : "Failed to load runtime settings from server.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [applyRuntimeSettingsSnapshot, employee, lang, loggedIn]);

  useEffect(() => {
    if (!APP_IN_PRODUCTION_MODE || !loggedIn || employee) return;
    if (!runtimeSettingsHydratedRef.current || runtimeSettingsSyncError) return;
    const signature = JSON.stringify(runtimeSettingsSnapshot);
    if (runtimeSettingsLastSavedSignatureRef.current === signature) return;

    if (runtimeSettingsSyncTimerRef.current) {
      window.clearTimeout(runtimeSettingsSyncTimerRef.current);
    }
    runtimeSettingsSyncTimerRef.current = window.setTimeout(() => {
      saveRuntimeSettingsViaApi({
        settings: runtimeSettingsSnapshot,
        reason: "owner_settings_autosave",
      })
        .then(() => {
          runtimeSettingsLastSavedSignatureRef.current = signature;
          setRuntimeSettingsSyncError("");
        })
        .catch((error) => {
          console.warn("runtime settings save failed", error);
          setRuntimeSettingsSyncError(
            lang === "ar"
              ? "تعذر حفظ إعدادات التشغيل على الخادم."
              : "Failed to save runtime settings on server.",
          );
        });
    }, 450);

    return () => {
      if (runtimeSettingsSyncTimerRef.current) {
        window.clearTimeout(runtimeSettingsSyncTimerRef.current);
      }
    };
  }, [employee, lang, loggedIn, runtimeSettingsSnapshot, runtimeSettingsSyncError]);

  useEffect(() => { writeCloseoutAlerts(closeoutAlerts); }, [closeoutAlerts]);
  useEffect(() => {
    if (APP_IN_PRODUCTION_MODE) return;
    autoResolveSubmittedCloseoutsWithoutReview((storeId) => Boolean(getStoreOperationalConfig(storeOperationalSettings, storeId).closeoutReviewEnabled));
  }, [storeOperationalSettings]);
  useEffect(() => {
    setCloseoutAlerts((current) => current.filter((alert) => getStoreOperationalConfig(storeOperationalSettings, alert.businessId).closeoutAlert));
  }, [storeOperationalSettings]);
  useEffect(() => {
    setStoreChannelSettings((current) => {
      let changed = false;
      const next = { ...current };
      configuredBusinesses.forEach((business) => {
        if (!next[business.id]) {
          next[business.id] = { channels: channels.map((channel) => ({ ...channel })), activeIds: channels.map((channel) => channel.id) };
          changed = true;
        }
      });
      return changed ? next : current;
    });
    setStoreOperationalSettings((current) => {
      let changed = false;
      const next = { ...current };
      configuredBusinesses.forEach((business) => {
        if (!next[business.id]) {
          next[business.id] = getStoreOperationalConfig({}, business.id);
          changed = true;
        }
      });
      return changed ? next : current;
    });
  }, [configuredBusinesses]);
  useEffect(() => { if (selectedBusiness !== "all" && !configuredBusinesses.some((business) => business.id === selectedBusiness)) setSelectedBusiness("all"); }, [selectedBusiness, configuredBusinesses]);
  useEffect(() => { if (assignedEmployeeBusinesses.length > 0 && !assignedEmployeeBusinesses.some((business) => business.id === employeeBusinessId)) setEmployeeBusinessId(assignedEmployeeBusinesses[0].id); }, [employeeBusinessId, assignedEmployeeBusinesses]);
  const hasPreviousCloseout = Boolean(currentEmployeeBusiness && lastCloseoutDates[currentEmployeeBusiness.id]);
  const todayDate = todayIsoDate();
  const calculatedSuggestedEntryDate = hasPreviousCloseout ? nextDayIso(lastCloseoutDates[currentEmployeeBusiness.id]) : todayDate;
  const suggestedEntryDate = calculatedSuggestedEntryDate > todayDate ? todayDate : calculatedSuggestedEntryDate;
  const pushCloseoutAlert = (payload, entry, actor) => {
    if (!closeoutAlertEnabledForBusiness(payload.businessId)) return;
    setCloseoutAlerts((current) => [{
      id: `co-${entry.id}`,
      businessId: payload.businessId,
      date: payload.date,
      entryId: entry.id,
      employeeNameAr: actor.nameAr,
      employeeNameEn: actor.nameEn,
      seen: false,
      at: Date.now(),
    }, ...current.filter((item) => item.id !== `co-${entry.id}`)]);
  };
  const persistEmployeeEntry = async (payload) => {
    if (savingRef.current || !payload?.businessId || !activeEmployee || !assignedEmployeeBusinesses.some((business) => business.id === payload.businessId)) return;
    if (payload.date > todayIsoDate()) { window.alert(text(lang, "futureDateNotAllowed")); return; }
    savingRef.current = true; setSaving(true);
    try {
      const actor = { role: "employee", userId: activeEmployee.id, nameAr: activeEmployee.nameAr, nameEn: activeEmployee.nameEn };
      if (entriesApiStrictMode) {
        const created = await createOperationalEntryInApi({
          payload,
          actorUserId: activeEmployee.id,
          actorRole: "employee",
        });
        if (!created) {
          window.alert(lang === "ar" ? "تعذر حفظ العملية على الخادم." : "Failed to save entry on server.");
          return;
        }
        const refreshed = await reloadAndSyncLastCloseout(payload.type === "summary" ? payload.businessId : null);
        if (payload.type === "summary") {
          const createdEntry = refreshed.find((entry) => entry.id === created.id);
          if (createdEntry) pushCloseoutAlert(payload, createdEntry, actor);
        }
        setEmployeePage("home"); showSaved();
        return;
      }
      const entry = buildEntry(payload, actor);
      if (entry.attachment) {
        try { await storeAttachmentPayload(entry.attachment); }
        catch { window.alert(text(lang, "attachmentSaveFailed")); return; }
      }
      setOperationalEntries((current) => [entry, ...current]);
      if (payload.type === "summary") {
        setLastCloseoutDates((current) => ({ ...current, [payload.businessId]: !current[payload.businessId] || payload.date > current[payload.businessId] ? payload.date : current[payload.businessId] }));
        pushCloseoutAlert(payload, entry, actor);
      }
      setEmployeePage("home"); showSaved();
    } finally { savingRef.current = false; setSaving(false); }
  };
  const saveEmployee = async (payload) => {
    if (savingRef.current || !payload?.businessId || !activeEmployee || !assignedEmployeeBusinesses.some((business) => business.id === payload.businessId)) return;
    if (payload.type === "summary") {
      const previousEntries = operationalEntries.filter((entry) => entry.type === "summary" && entryIsActive(entry) && entry.businessId === payload.businessId && entry.date === payload.date);
      if (previousEntries.length > 0) { setPendingDuplicateSummary({ payload, previousEntries }); return; }
    }
    await persistEmployeeEntry(payload);
  };
  const saveOwner = async (payload) => {
    if (savingRef.current || !payload?.businessId || !activeBusinesses.some((business) => business.id === payload.businessId)) return;
    if (payload.date > todayIsoDate()) { window.alert(text(lang, "futureDateNotAllowed")); return; }
    savingRef.current = true; setSaving(true);
    try {
      if (entriesApiStrictMode) {
        const created = await createOperationalEntryInApi({
          payload,
          actorUserId: ownerApiUserId,
          actorRole: "owner",
        });
        if (!created) {
          window.alert(lang === "ar" ? "تعذر حفظ العملية على الخادم." : "Failed to save entry on server.");
          return;
        }
        const refreshed = await reloadAndSyncLastCloseout(payload.type === "summary" ? payload.businessId : null);
        if (payload.type === "summary") {
        }
        setOwnerPage("home");
        if (payload.type !== "summary") {
          const createdEntry = refreshed.find((entry) => entry.id === created.id);
          setSavedOutflowShareTarget(createdEntry || null);
        } else {
          showSaved();
        }
        return;
      }
      const entry = buildEntry(payload, currentOwnerActor);
      if (entry.attachment) {
        try { await storeAttachmentPayload(entry.attachment); }
        catch { window.alert(text(lang, "attachmentSaveFailed")); return; }
      }
      setOperationalEntries((current) => [entry, ...current]);
      if (payload.type === "summary") setLastCloseoutDates((current) => ({ ...current, [payload.businessId]: !current[payload.businessId] || payload.date > current[payload.businessId] ? payload.date : current[payload.businessId] }));
      setOwnerPage("home");
      if (payload.type !== "summary") setSavedOutflowShareTarget(entry);
      else { showSaved(); }
    } finally { savingRef.current = false; setSaving(false); }
  };
  const saveOwnerSummary = async (payload) => {
    if (savingRef.current || !payload?.businessId) return;
    const previousEntries = operationalEntries.filter((entry) => entry.type === "summary" && entryIsActive(entry) && entry.businessId === payload.businessId && entry.date === payload.date);
    if (previousEntries.length > 0) { setPendingDuplicateSummary({ payload, previousEntries, actor: "owner" }); return; }
    await saveOwner(payload);
  };
  const confirmReview = async (entryId) => {
    if (entriesApiStrictMode) {
      const target = operationalEntries.find((entry) => entry.id === entryId);
      if (!target) return;
      try {
        const reviewed = await reviewStoreEntryViaApi({
          organizationId: closeoutsApiOrganizationId,
          actorUserId: ownerApiUserId,
          actorRole: "owner",
          entry: target,
        });
        if (!reviewed) {
          window.alert(lang === "ar" ? "تعذر تحديث المراجعة على الخادم." : "Failed to update review on server.");
          return;
        }
        await loadOperationalEntriesFromApi();
        setSelected(null);
      } catch (error) {
        console.warn("entry review api failed", error);
        window.alert(lang === "ar" ? "تعذر تحديث المراجعة على الخادم." : "Failed to update review on server.");
      }
      return;
    }
    const actionAt = new Date().toISOString();
    setOperationalEntries((current) => current.map((entry) => entry.id === entryId && entryIsActive(entry) ? { ...entry, reviewed: true, reviewedAt: actionAt, reviewedBy: currentOwnerActor, auditTrail: [...(entry.auditTrail || []), { action: "reviewed", at: actionAt, by: currentOwnerActor, reason: "" }] } : entry));
    setSelected(null);
  };
  const requestVoidOperation = (entryId) => {
    const target = operationalEntries.find((entry) => entry.id === entryId);
    if (!target || entryIsVoided(target) || archivedBusinessIds.includes(target.businessId)) return;
    setVoidTarget(target);
  };
  const requestRestoreOperation = (entryId) => {
    const target = operationalEntries.find((entry) => entry.id === entryId);
    if (!target || !entryIsVoided(target) || archivedBusinessIds.includes(target.businessId)) return;
    setRestoreTarget(target);
  };
  const confirmDuplicateSummary = async () => {
    const pending = pendingDuplicateSummary;
    if (!pending?.payload) return;
    setPendingDuplicateSummary(null);
    if (pending.actor === "owner") await saveOwner(pending.payload);
    else await persistEmployeeEntry(pending.payload);
  };
  const reviewDuplicateSales = (alert) => {
    if (!alert?.businessId || !alert?.date) return;
    setArchivedReadOnlyBusinessId(null);
    setSelectedBusiness(alert.businessId);
    setDuplicateReviewFocus({ businessId: alert.businessId, date: alert.date, openedAt: Date.now() });
    setOwnerPage("register");
  };
  const acknowledgeDuplicateSales = (alert) => {
    if (!alert?.businessId || !alert?.date || !alert.entries?.length) return;
    const actionAt = new Date().toISOString();
    const approvedIds = new Set(alert.entries.map((entry) => entry.id));
    setOperationalEntries((current) => current.map((entry) => approvedIds.has(entry.id) ? { ...entry, auditTrail: [...(entry.auditTrail || []), { action: "duplicate_approved", at: actionAt, by: currentOwnerActor, reason: "" }] } : entry));
    setAcknowledgedDuplicateSales((current) => ({ ...current, [duplicateSalesGroupKey(alert)]: duplicateSalesSignature(alert.entries) }));
  };
  const confirmVoidOperation = async (reason = "") => {
    if (entriesApiStrictMode) {
      const target = voidTarget;
      if (!target || entryIsVoided(target) || archivedBusinessIds.includes(target.businessId)) { setVoidTarget(null); return; }
      try {
        const voided = await voidEntryViaHook({
          entry: target,
          reason: reason.trim(),
        });
        if (!voided) {
          window.alert(lang === "ar" ? "تعذر إلغاء العملية على الخادم." : "Failed to void entry on server.");
          return;
        }
        await reloadAndSyncLastCloseout(target.type === "summary" ? target.businessId : null);
        setVoidTarget(null);
        setSelected(null);
      } catch (error) {
        console.warn("entry void api failed", error);
        window.alert(lang === "ar" ? "تعذر إلغاء العملية على الخادم." : "Failed to void entry on server.");
      }
      return;
    }
    const target = voidTarget;
    if (!target || entryIsVoided(target) || archivedBusinessIds.includes(target.businessId)) { setVoidTarget(null); return; }
    const actionAt = new Date().toISOString();
    const nextEntries = operationalEntries.map((entry) => entry.id === target.id ? { ...entry, status: "voided", voidedAt: actionAt, voidedBy: currentOwnerActor, voidReason: reason.trim(), auditTrail: [...(entry.auditTrail || []), { action: "voided", at: actionAt, by: currentOwnerActor, reason: reason.trim() }] } : entry);
    setOperationalEntries(nextEntries);
    if (target.type === "summary") {
      const latestActiveCloseoutDate = nextEntries.filter((entry) => entry.businessId === target.businessId && entry.type === "summary" && entryIsActive(entry)).map((entry) => entry.date).sort().pop();
      setLastCloseoutDates((current) => { const next = { ...current }; if (latestActiveCloseoutDate) next[target.businessId] = latestActiveCloseoutDate; else delete next[target.businessId]; return next; });
    }
    setVoidTarget(null);
    setSelected(null);
  };
  const confirmRestoreOperation = async (reason = "") => {
    if (entriesApiStrictMode) {
      const target = restoreTarget;
      if (!target || !entryIsVoided(target) || archivedBusinessIds.includes(target.businessId)) { setRestoreTarget(null); return; }
      try {
        const restored = await restoreEntryViaHook({
          entry: target,
          reason: reason.trim(),
        });
        if (!restored) {
          window.alert(lang === "ar" ? "تعذر استرجاع العملية على الخادم." : "Failed to restore entry on server.");
          return;
        }
        const refreshed = await loadOperationalEntriesFromApi();
        if (target.type === "summary") {
          const latestActiveCloseoutDate = refreshed
            .filter((entry) => entry.businessId === target.businessId && entry.type === "summary" && entryIsActive(entry))
            .map((entry) => entry.date)
            .sort()
            .pop();
          setLastCloseoutDates((current) => ({ ...current, [target.businessId]: latestActiveCloseoutDate || target.date }));
        }
        setRestoreTarget(null);
        setSelected(null);
      } catch (error) {
        console.warn("entry restore api failed", error);
        window.alert(lang === "ar" ? "تعذر استرجاع العملية على الخادم." : "Failed to restore entry on server.");
      }
      return;
    }
    const target = restoreTarget;
    if (!target || !entryIsVoided(target) || archivedBusinessIds.includes(target.businessId)) { setRestoreTarget(null); return; }
    const actionAt = new Date().toISOString();
    const nextEntries = operationalEntries.map((entry) => entry.id === target.id ? { ...entry, status: "active", restoredAt: actionAt, restoredBy: currentOwnerActor, restoreReason: reason.trim(), auditTrail: [...(entry.auditTrail || []), { action: "restored", at: actionAt, by: currentOwnerActor, reason: reason.trim() }] } : entry);
    setOperationalEntries(nextEntries);
    if (target.type === "summary") {
      const latestActiveCloseoutDate = nextEntries.filter((entry) => entry.businessId === target.businessId && entry.type === "summary" && entryIsActive(entry)).map((entry) => entry.date).sort().pop();
      setLastCloseoutDates((current) => ({ ...current, [target.businessId]: latestActiveCloseoutDate || target.date }));
    }
    setRestoreTarget(null);
    setSelected(null);
  };
  const completeOwnerLogin = (apiUserId = "") => {
    saveAuthSession({ role: "owner" });
    setSessionUserId(typeof apiUserId === "string" ? apiUserId : "");
    setLoggedIn(true);
    setEmployee(false);
    setLoggedInEmployeeId(null);
    setAuthScreen("owner");
    setOwnerPage("home");
  };
  const completeEmployeeLogin = (personId, apiUserId = "") => {
    const person = staff.find((item) => item.id === personId && item.active && !item.removed);
    const resolvedEmployeeId = person?.id || (typeof apiUserId === "string" && apiUserId ? apiUserId : personId);
    if (!resolvedEmployeeId) return;
    saveAuthSession({ role: "employee", employeeId: resolvedEmployeeId });
    setSessionUserId(typeof apiUserId === "string" ? apiUserId : "");
    setLoggedIn(true);
    setEmployee(true);
    setLoggedInEmployeeId(resolvedEmployeeId);
    setEmployeeBusinessId(person?.storeIds?.[0] || activeBusinesses[0]?.id || "");
    setEmployeeThemeOverride(readEmployeeNotebookTheme(resolvedEmployeeId));
    setEmployeePage("closeouts");
    setAuthScreen("owner");
  };
  const removeOperationalEntriesForCloseout = useCallback((closeoutId, storeId = null) => {
    if (!closeoutId) return;
    setOperationalEntries((current) => current.filter((entry) => entry.closeoutId !== closeoutId));
    if (storeId) {
      setOperationalEntries((current) => {
        const filtered = current.filter((entry) => entry.closeoutId !== closeoutId);
        const latestActiveCloseoutDate = filtered
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
        return filtered;
      });
    }
  }, []);

  const syncCloseoutToOperationalEntries = useCallback(async (closeout, { force = false } = {}) => {
    if (PRODUCTION_API_ENTRIES_MODE) return;
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
        setLastCloseoutDates((current) => ({
          ...current,
          [summaryEntry.businessId]: !current[summaryEntry.businessId] || summaryEntry.date > current[summaryEntry.businessId] ? summaryEntry.date : current[summaryEntry.businessId],
        }));
      }
    }
  }, [lang, removeOperationalEntriesForCloseout]);

  const handleOwnerCloseoutUpdated = useCallback(async (closeout) => {
    if (!closeout) return;
    if (closeout.status === "reviewed") {
      await syncCloseoutToOperationalEntries({ ...closeout, syncedToEntries: false }, { force: true });
      return;
    }
    removeOperationalEntriesForCloseout(closeout.id, closeout.storeId);
  }, [removeOperationalEntriesForCloseout, syncCloseoutToOperationalEntries]);

  const handleOwnerCloseoutDeleted = useCallback(async (closeout) => {
    if (!closeout) return;
    removeOperationalEntriesForCloseout(closeout.id, closeout.storeId);
    setCloseoutAlerts((current) => current.filter((item) => !(item.businessId === closeout.storeId && item.date === closeout.date)));
    setOwnerReviewCloseout((current) => (current?.id === closeout.id ? null : current));
    setReturnCloseoutTarget((current) => (current?.id === closeout.id ? null : current));
  }, [removeOperationalEntriesForCloseout]);
  const reviewCloseoutAlert = (alert) => {
    if (!alert?.businessId || !alert?.date) return;
    setArchivedReadOnlyBusinessId(null);
    setSelectedBusiness(alert.businessId);
    setOwnerPage("register");
    if (alert.entryId) setSelected(operationalEntries.find((entry) => entry.id === alert.entryId) || null);
    setCloseoutAlerts((current) => current.map((item) => item.id === alert.id ? { ...item, seen: true } : item));
  };
  const dismissCloseoutAlert = (alertId) => {
    setCloseoutAlerts((current) => current.map((item) => item.id === alertId ? { ...item, seen: true } : item));
  };
  const handleOpenOwnerOperation = useCallback((entry) => {
    if (!APP_IN_PRODUCTION_MODE && entry?.type === "summary" && entry.closeoutId) {
      const closeout = readDailyCloseouts().find((item) => item.id === entry.closeoutId);
      if (closeout) {
        setReturnCloseoutTarget(null);
        setOwnerReviewCloseout(closeout);
        return;
      }
    }
    setSelected(entry || null);
  }, []);
  const logout = async () => {
    if (APP_IN_PRODUCTION_MODE) {
      try {
        await logoutSessionViaApi();
      } catch (error) {
        console.warn("logout api failed", error);
      }
    }
    clearAuthSession();
    setSessionUserId("");
    setLoggedIn(false);
    setEmployee(false);
    setLoggedInEmployeeId(null);
    setAuthScreen("owner");
    setEmployeePage("closeouts");
    setOwnerPage("home");
    setOwnerReviewCloseout(null);
    setReturnCloseoutTarget(null);
    setSelected(null);
    setVoidTarget(null);
    setRestoreTarget(null);
    setSavedOutflowShareTarget(null);
    setPendingDuplicateSummary(null);
    setDuplicateReviewFocus(null);
    setAttachmentReviewRequest(null);
    setShareSnapshot(null);
    setQuickAddOpen(false);
    setArchivedReadOnlyBusinessId(null);
    setSelectedBusiness("all");
    if (APP_IN_PRODUCTION_MODE) {
      setOperationalEntries([]);
      setStaff([]);
      setConfiguredBusinesses([]);
      setArchivedBusinessIds([]);
      setAuthOwnerUsername("");
      setAuthOwnerPassword("");
      setAuthEmployeePins({});
      setOwnerProfile({ name: "" });
      runtimeSettingsHydratedRef.current = false;
      runtimeSettingsLastSavedSignatureRef.current = "";
    }
  };
  const ownerDisplayName = ownerProfile?.name || (lang === "ar" ? "المالك" : "Owner");
  const closeoutsApiEnabled = process.env.NEXT_PUBLIC_CLOSEOUTS_API_ENABLED === "true";
  const closeoutsApiStrictMode = APP_IN_PRODUCTION_MODE;
  const closeoutsApiOrganizationId = process.env.NEXT_PUBLIC_CLOSEOUTS_API_ORGANIZATION_ID || "";
  const closeoutsApiOwnerUserId = process.env.NEXT_PUBLIC_CLOSEOUTS_API_OWNER_USER_ID || "";
  const ownerApiUserId = sessionUserId || closeoutsApiOwnerUserId;
  const apiActorRole = employee ? "employee" : "owner";
  const apiActorUserId = employee
    ? (sessionUserId || activeEmployee?.apiUserId || activeEmployee?.id || "")
    : ownerApiUserId;
  const apiTargetStoreIdsKey = (employee ? assignedEmployeeBusinesses : reportingBusinesses)
    .map((store) => store.id)
    .filter(Boolean)
    .join("|");
  const entriesApiEnabled = process.env.NEXT_PUBLIC_ENTRIES_API_ENABLED
    ? process.env.NEXT_PUBLIC_ENTRIES_API_ENABLED === "true"
    : closeoutsApiEnabled;
  const entriesApiStrictMode = PRODUCTION_API_ENTRIES_MODE;

  const {
    loadEntries: loadOperationalEntriesFromApi,
    createEntry: createOperationalEntryInApi,
    voidEntry: voidEntryViaHook,
    restoreEntry: restoreEntryViaHook,
    syncSubmitCloseout: syncSubmitCloseoutToApi,
    syncReviewCloseout: syncReviewCloseoutToApi,
    loadCloseouts: loadCloseoutsFromApi,
    reloadAndSyncLastCloseout,
  } = useOperationalEntriesApi({
    organizationId: closeoutsApiOrganizationId,
    ownerUserId: ownerApiUserId,
    apiActorUserId,
    apiActorRole,
    apiTargetStoreIdsKey,
    entriesApiEnabled,
    entriesApiStrictMode,
    closeoutsApiEnabled,
    closeoutsApiStrictMode,
    setEntries: setOperationalEntries,
    setEntriesSyncError: setOperationalEntriesSyncError,
    setLastCloseoutDates,
  });

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
    loadOperationalEntriesFromApi().catch((error) => {
      console.warn("operational entries API load failed", error);
      setOperationalEntriesSyncError(
        lang === "ar"
          ? "تعذر تحديث السجل التشغيلي من الخادم."
          : "Failed to refresh operational register from server.",
      );
    });
  }, [entriesApiEnabled, entriesApiStrictMode, lang, loadOperationalEntriesFromApi, loggedIn]);

  useEffect(() => {
    if (!operationalEntriesSyncError) return;
    console.warn(operationalEntriesSyncError);
  }, [operationalEntriesSyncError]);
  useEffect(() => {
    if (!runtimeSettingsSyncError) return;
    console.warn(runtimeSettingsSyncError);
  }, [runtimeSettingsSyncError]);

  if (!loggedIn) {
    return (
      <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-[100dvh] bg-[#F8F6F0] font-sans text-[#112A46]">
        <AppFontStyles />
        {authScreen === "owner" ? (
          <LoginScreen lang={lang} setLang={setLang} onOwnerLogin={completeOwnerLogin} onEmployeePortal={() => setAuthScreen("employee")} />
        ) : (
          <EmployeeLoginScreen lang={lang} setLang={setLang} staff={staff} onBack={() => setAuthScreen("owner")} onLogin={completeEmployeeLogin} />
        )}
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
      loadCloseoutsFromApi={loadCloseoutsFromApi}
      apiStrictMode={closeoutsApiStrictMode}
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
            notebookMode={employee || (!employee && (ownerPage === "home" || ownerPage === "reports" || ownerPage === "register"))}
            notebookTheme={employee ? employeeNotebookTheme : notebookTheme}
            onLogout={logout}
            onEmployeeSettings={() => employeeSettingsOpenerRef.current?.()}
            onNotifications={() => { setArchivedReadOnlyBusinessId(null); if (duplicateSalesAlerts.length > 0) { setAttachmentReviewRequest(null); reviewDuplicateSales(duplicateSalesAlerts[0]); } else if (firstPendingAttachmentReview) { setDuplicateReviewFocus(null); setAttachmentReviewRequest({ businessId: firstPendingAttachmentReview.businessId, date: firstPendingAttachmentReview.date, entryId: firstPendingAttachmentReview.id, openedAt: Date.now() }); setOwnerPage("register"); } else if (unseenCloseoutAlerts[0]) { reviewCloseoutAlert(unseenCloseoutAlerts[0]); } }}
            showNotifications={ownerNotificationsVisible}
            hasNotificationBadge={ownerNotificationBadge}
          />
          <div className="taq-scroll relative min-h-0 overflow-y-auto overscroll-y-contain">{employee && !activeEmployee && <section className="px-5 pb-24"><div className="rounded-3xl bg-white p-8 text-center text-sm font-bold text-[#827762] ring-1 ring-black/[0.045]">{runtimeSettingsHydratedRef.current ? text(lang, "noActiveEmployee") : (lang === "ar" ? "جاري تحميل بيانات الموظف..." : "Loading employee data...")}</div></section>}{employee && activeEmployee && employeePage === "closeouts" && <EmployeeCloseoutsView lang={lang} employee={activeEmployee} currentStore={currentEmployeeBusiness} assignedStores={assignedEmployeeBusinesses} onSelectStore={setEmployeeBusinessId} salesChannels={currentEmployeeChannelConfig.channels.filter((channel) => currentEmployeeChannelConfig.activeIds.includes(channel.id) && !channel.retired).map((channel) => ({ ...channel, displayName: channelName(channel, lang) }))} notebookTheme={employeeNotebookTheme} reviewWorkflowEnabled={closeoutReviewEnabledForBusiness(currentEmployeeBusiness?.id)} employeeHistoryVisibility={currentEmployeeOperationalConfig.employeeHistoryVisibility || "all"} formatCalendarDate={formatCalendarDate} channelLabel={(channel) => channel.displayName || channelName(channel, lang)} settingsPanel={({ onBack }) => <EmployeeSettingsScreen lang={lang} onBack={onBack} currentStore={currentEmployeeBusiness} assignedStores={assignedEmployeeBusinesses} onSelectStore={setEmployeeBusinessId} employeeNotebookTheme={employeeThemeOverride || readEmployeeNotebookTheme(activeEmployee.id) || employeeNotebookTheme} setEmployeeNotebookTheme={(theme) => { writeEmployeeNotebookTheme(activeEmployee.id, theme); setEmployeeThemeOverride(theme); }} onOpenSupport={() => openWhatsAppSupport(lang)} onOpenHelp={() => setHelpOpen(true)} />} onEntryActiveChange={setEmployeeEntryActive} onRegisterAdd={(handler) => { employeeAddHandlerRef.current = handler || (() => {}); }} onRegisterSettingsOpener={(handler) => { employeeSettingsOpenerRef.current = handler || (() => {}); }} saving={saving} />}{!employee && ownerPage === "home" && <NotebookScrollSurface theme={notebookTheme} lang={lang}><OwnerHomeConnected lang={lang} operationalEntries={operationalEntries} duplicateSalesAlerts={duplicateSalesAlerts} closeoutAlerts={unseenCloseoutAlerts} closeoutReviewEnabledForBusiness={closeoutReviewEnabledForBusiness} onViewPendingCloseouts={(closeout) => { setOwnerReviewCloseout(closeout); setSelectedBusiness(closeout.storeId); }} onReviewCloseout={reviewCloseoutAlert} onDismissCloseout={dismissCloseoutAlert} onReviewDuplicate={reviewDuplicateSales} onAcknowledgeDuplicate={acknowledgeDuplicateSales} reviewEnabledForBusiness={reviewEnabledForBusiness} onOpenOperation={handleOpenOwnerOperation} onShareNotebook={setShareSnapshot} notebookTheme={notebookTheme} selectedBusiness={activeViewBusiness} setSelectedBusiness={setSelectedBusiness} reviewEnabled={ownerReviewEnabled} businessesList={activeBusinesses} /></NotebookScrollSurface>}{!employee && ownerPage === "add-summary" && <OwnerSummaryScreen lang={lang} saving={saving} selectedBusiness={activeViewBusiness} businessesList={activeBusinesses} storeChannelSettings={storeChannelSettings} onBack={() => setOwnerPage("home")} onSave={saveOwnerSummary} />}{!employee && ownerPage === "add-expense" && <OwnerExpenseScreen lang={lang} saving={saving} selectedBusiness={activeViewBusiness} businessesList={activeBusinesses} storeOperationalSettings={storeOperationalSettings} onBack={() => setOwnerPage("home")} onSave={saveOwner} />}{!employee && ownerPage === "reports" && <NotebookScrollSurface theme={notebookTheme} lang={lang}><ReportsScreen lang={lang} operationalEntries={operationalEntries} archivedReadOnlyBusinessId={archivedReadOnlyBusinessId} reviewEnabledForBusiness={reviewEnabledForBusiness} onShareNotebook={setShareSnapshot} notebookTheme={notebookTheme} setNotebookTheme={setNotebookTheme} selectedBusiness={selectedBusiness} setSelectedBusiness={setSelectedBusiness} configuredChannels={reportChannelConfig.channels} reviewEnabled={ownerReviewEnabled} businessesList={reportingBusinesses} archivedBusinessIds={archivedBusinessIds} /></NotebookScrollSurface>}{!employee && ownerPage === "register" && <OwnerRegisterConnected lang={lang} onOpenOperation={handleOpenOwnerOperation} reviewFocus={duplicateReviewFocus} attachmentReviewRequest={attachmentReviewRequest} archivedReadOnlyBusinessId={archivedReadOnlyBusinessId} operationalEntries={operationalEntries} selectedBusiness={selectedBusiness} setSelectedBusiness={setSelectedBusiness} businessesList={reportingBusinesses} archivedBusinessIds={archivedBusinessIds} notebookTheme={notebookTheme} />}{!employee && ownerPage === "settings" && <OwnerSettingsScreen lang={lang} operationalEntries={operationalEntries} selectedBusiness={selectedBusiness} setSelectedBusiness={setSelectedBusiness} setOwnerPage={setOwnerPage} setArchivedReadOnlyBusinessId={setArchivedReadOnlyBusinessId} setLastCloseoutDates={setLastCloseoutDates} notebookTheme={notebookTheme} setNotebookTheme={setNotebookTheme} storeChannelSettings={storeChannelSettings} setStoreChannelSettings={setStoreChannelSettings} storeOperationalSettings={storeOperationalSettings} setStoreOperationalSettings={setStoreOperationalSettings} configuredBusinesses={configuredBusinesses} setConfiguredBusinesses={setConfiguredBusinesses} archivedBusinessIds={archivedBusinessIds} setArchivedBusinessIds={setArchivedBusinessIds} staff={staff} setStaff={setStaff} ownerProfile={ownerProfile} setOwnerProfile={setOwnerProfile} authOwnerUsername={authOwnerUsername} setAuthOwnerUsername={setAuthOwnerUsername} authOwnerPassword={authOwnerPassword} setAuthOwnerPassword={setAuthOwnerPassword} authEmployeePins={authEmployeePins} setAuthEmployeePins={setAuthEmployeePins} onPersistSettingsNow={persistRuntimeSettingsNow} onLogout={logout} onOpenSupport={() => openWhatsAppSupport(lang)} onOpenHelp={() => setHelpOpen(true)} />}{saved && <div className="sticky bottom-4 left-4 right-4 z-30 mx-auto max-w-md rounded-2xl bg-[#112A46] p-4 text-xs font-bold text-white">{text(lang, "savedNotice")}</div>}
          </div>
          {!(employee && employeeEntryActive) && <BottomNav lang={lang} employee={employee} active={employee ? employeePage : ownerPage} onAdd={() => { if (employee) employeeAddHandlerRef.current?.(); else setQuickAddOpen(true); }} onChange={(page) => { setQuickAddOpen(false); if (employee) { if (page === "home") setEmployeePage("closeouts"); else setEmployeePage(page); } else { setArchivedReadOnlyBusinessId(null); setDuplicateReviewFocus(null); setAttachmentReviewRequest(null); setSelectedBusiness("all"); setOwnerPage(page); } }} />}{!employee && <QuickAddSheet lang={lang} employee={false} open={quickAddOpen} onClose={() => setQuickAddOpen(false)} onSummary={() => { setQuickAddOpen(false); setOwnerPage("add-summary"); }} onExpense={() => { setQuickAddOpen(false); setOwnerPage("add-expense"); }} />}<OperationModal lang={lang} item={selected} onClose={() => setSelected(null)} onReview={confirmReview} onVoid={requestVoidOperation} onRestore={requestRestoreOperation} reviewEnabled={selectedOperationReviewEnabled} canVoid={Boolean(selected) && !archivedBusinessIds.includes(selected?.businessId)} canRestore={Boolean(selected) && !archivedBusinessIds.includes(selected?.businessId)} /><DuplicateSalesDialog lang={lang} draft={pendingDuplicateSummary?.payload || null} previousEntries={pendingDuplicateSummary?.previousEntries || []} businessesList={activeBusinesses} onCancel={() => setPendingDuplicateSummary(null)} onConfirm={confirmDuplicateSummary} /><VoidOperationDialog lang={lang} item={voidTarget} onCancel={() => setVoidTarget(null)} onConfirm={confirmVoidOperation} /><RestoreOperationDialog lang={lang} item={restoreTarget} onCancel={() => setRestoreTarget(null)} onConfirm={confirmRestoreOperation} /><SavedOutflowShareDialog lang={lang} item={savedOutflowShareTarget} businessesList={activeBusinesses} onClose={() => setSavedOutflowShareTarget(null)} /><NotebookShareModal lang={lang} snapshot={shareSnapshot} onClose={() => setShareSnapshot(null)} businessesList={reportingBusinesses} operationalEntries={operationalEntries} archivedBusinessIds={archivedBusinessIds} />
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

