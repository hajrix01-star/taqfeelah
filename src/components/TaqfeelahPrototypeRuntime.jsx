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

const employeeActorAhmed = { role: "employee", userId: "ahmed", nameAr: "أحمد", nameEn: "Ahmed" };
const employeeActorSara = { role: "employee", userId: "sara", nameAr: "سارة", nameEn: "Sara" };
const newId = (prefix = "entry") => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const ownerActor = { role: "owner", userId: "owner", nameAr: "محمد الهاجري", nameEn: "Mohammad Alhajri" };
function isoDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return isoCalendarDate(date.getFullYear(), date.getMonth(), date.getDate());
}
function entryCreatedAt(isoDate, hour, minute = 0) {
  const stamp = new Date(`${isoDate}T12:00:00`);
  stamp.setHours(hour, minute, 0, 0);
  return stamp.toISOString();
}
function demoAttachment(id) {
  return { id, kind: "image", name: "receipt.jpg", mimeType: "image/jpeg", sizeBytes: 18400 };
}
function createDemoOperationalEntry(partial) {
  const id = partial.id || newId(partial.type);
  const createdAt = partial.createdAt || entryCreatedAt(partial.date, 12, 0);
  const amount = partial.amount ?? (partial.type === "summary"
    ? (partial.salesChannels || []).reduce((sum, row) => sum + row.amount, 0)
    : toAmount(partial.amountInput ?? 0));
  return {
    id,
    businessId: partial.businessId,
    date: partial.date,
    createdAt,
    type: partial.type,
    categoryId: partial.categoryId || null,
    amount,
    salesChannels: partial.salesChannels || [],
    note: partial.note || "",
    noteKey: partial.noteKey || null,
    enteredBy: partial.enteredBy || ownerActor,
    attachment: partial.attachment ? { ...partial.attachment, id: partial.attachment.id || `attachment-${id}` } : null,
    reviewed: partial.reviewed ?? false,
    status: partial.status || "active",
    voidedAt: partial.voidedAt || null,
    voidedBy: partial.voidedBy || null,
    voidReason: partial.voidReason || "",
    restoredAt: partial.restoredAt || null,
    restoredBy: partial.restoredBy || null,
    restoreReason: partial.restoreReason || "",
    auditTrail: partial.auditTrail || [{ action: "created", at: createdAt, by: partial.enteredBy || ownerActor, reason: "" }],
  };
}
function createDemoOperationalEntries() {
  return createPrototypeMonthDemoOperationalEntries();
}
function readOperationalEntries() {
  if (typeof window === "undefined") return BINDS_TO_SERVER_AUTH || ENTRIES_API_DB_SOURCE ? [] : createDemoOperationalEntries();
  if (BINDS_TO_SERVER_AUTH || ENTRIES_API_DB_SOURCE) return [];
  const stored = readLocalStorageJson(OPERATIONAL_ENTRIES_STORAGE_KEY, null);
  if (!Array.isArray(stored) || stored.length === 0) return createDemoOperationalEntries();
  return stored.map((entry) => ({
    ...entry,
    auditTrail: Array.isArray(entry.auditTrail) && entry.auditTrail.length
      ? entry.auditTrail
      : [{ action: "created", at: entry.createdAt || new Date().toISOString(), by: entry.enteredBy || ownerActor, reason: "" }],
  }));
}
function summaryDayFromEntriesWithLabels(entries, businessId, date, reviewEnabledForBusiness = () => false) {
  return summaryDayFromEntries(entries, businessId, date, reviewEnabledForBusiness, formatCalendarDate);
}
function operationTime(item, lang) {
  if (!item.createdAt) return opTime(item, lang);
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(item.createdAt));
}
function buildEntry(payload, actor) {
  return buildOperationalEntry(payload, actor, {
    createId: () => newId(payload.type),
    parseAmount: toAmount,
  });
}
function attachmentsFromEntries(entries) {
  return groupAttachmentsFromEntries(entries, noteLabel);
}




function OwnerHome({ lang, operationalEntries = [], operationalEntriesLoading = false, duplicateSalesAlerts = [], closeoutAlerts = [], pendingEmployeeCloseouts = [], onViewPendingCloseouts = () => {}, onReviewCloseout = () => {}, onDismissCloseout = () => {}, onReviewDuplicate = () => {}, onAcknowledgeDuplicate = () => {}, reviewEnabledForBusiness = () => false, onOpenOperation = () => {}, onShareNotebook = () => {}, notebookTheme = "yellow", selectedBusiness = "all", setSelectedBusiness = () => {}, reviewEnabled = false, businessesList = businesses, summaryApiEnabled = false, summaryApiOrganizationId = "", summaryApiActorUserId = "", summaryApiActorRole = "owner", summaryRefreshKey = 0 }) {
  const [period, setPeriod] = useState("day");
  const [selectedDay, setSelectedDay] = useState(() => todayIsoDate());
  const [selectedDate, setSelectedDate] = useState(() => todayIsoDate());
  const [selectedMonth, setSelectedMonth] = useState(() => todayIsoDate().slice(0, 7));
  const [expanded, setExpanded] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const monthly = period === "month";
  const isCombined = selectedBusiness === "all";
  const currentBusiness = businessesList.find((business) => business.id === selectedBusiness) || businessesList[0] || null;
  const scopedBusinesses = isCombined ? businessesList : currentBusiness ? [currentBusiness] : [];
  const summaryApiActive = summaryApiEnabled;
  const {
    businessesWithDaySummaries,
    combinedResult: apiCombinedResult,
    getStoreResult,
    error: summaryApiError,
  } = useStoreDaySummaries({
    enabled: summaryApiActive,
    period: monthly ? "month" : "day",
    organizationId: summaryApiOrganizationId,
    actorUserId: summaryApiActorUserId,
    actorRole: summaryApiActorRole,
    businesses: businessesList,
    date: selectedDate,
    month: selectedMonth,
    refreshKey: summaryRefreshKey,
  });
  const localComparisonBusinesses = buildBusinessesWithEntrySummaries({
    businesses: scopedBusinesses,
    operationalEntries,
    monthly,
    selectedDate,
    selectedMonth,
    reviewEnabledForBusiness,
  });
  const daySummary = summaryDayFromEntriesWithLabels(operationalEntries, currentBusiness?.id, selectedDate, reviewEnabledForBusiness);
  const localCombinedResult = summarizeEntries(operationalEntries.filter((entry) => businessesList.some((business) => business.id === entry.businessId) && entryDateMatches(entry, period, selectedDate, selectedMonth, "2026", "2026-01-01", "2026-12-31")), reviewEnabledForBusiness);
  const apiStoreResult = currentBusiness?.id ? getStoreResult(currentBusiness.id) : null;
  const localMonthResult = summaryMonthFromEntries(operationalEntries, currentBusiness?.id, selectedMonth, reviewEnabledForBusiness);
  const preferEntrySummaries = resolveOwnerPeriodSummaryPreference({
    localTotals: localCombinedResult,
    apiTotals: apiCombinedResult,
    entriesLoading: operationalEntriesLoading,
  });
  const localSummaryHasFinancialActivity = entryTotalsHaveFinancialActivity(localCombinedResult);
  const summaryLoadFailedWithoutFallback = summaryApiActive && summaryApiError && !localSummaryHasFinancialActivity;
  const summaryLoadErrorMessage = lang === "ar"
    ? "تعذر تحميل الملخص المالي من الخادم. لم يتم عرض أرقام بديلة حتى لا تظهر أصفار غير صحيحة."
    : "Failed to load the financial summary from the server. No fallback figures are shown to avoid incorrect zero totals.";
  const comparisonBusinesses = preferEntrySummaries ? localComparisonBusinesses : businessesWithDaySummaries;
  const result = isCombined
    ? preferEntrySummaries ? localCombinedResult : apiCombinedResult
    : monthly
      ? resolveOwnerSingleStoreTotals(localMonthResult, apiStoreResult, preferEntrySummaries)
      : resolveOwnerSingleStoreTotals(daySummary, apiStoreResult, preferEntrySummaries);
  const selectedBusinessEntries = currentBusiness ? entriesInPeriod(operationalEntries, currentBusiness.id, "day", selectedDate, selectedMonth) : [];
  const visibleDayOperations = newestEntries(selectedBusinessEntries);
  const attachmentGroup = attachmentsFromEntries(selectedBusinessEntries)[0] || null;
  const changePeriod = (nextPeriod) => {
    setPeriod(nextPeriod);
    setExpanded(false);
    setShowAttachments(false);
  };
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-owner-page taq-notebook-body pb-6 pt-1">
      {pendingEmployeeCloseouts.length > 0 && <PendingCloseoutsNotice lang={lang} pending={pendingEmployeeCloseouts} onView={onViewPendingCloseouts} />}
      {closeoutAlerts.length > 0 && <div className="mx-2 mb-3 rounded-2xl bg-[#E6F5E9] p-3 ring-1 ring-[#39A160]/15"><div className="flex items-start gap-2"><Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#257844]" /><div className="min-w-0 flex-1"><p className="text-taq-meta font-black text-[#257844]">{text(lang, "closeoutInAppAlert")}</p><p className="mt-1 text-taq-meta font-bold text-[#716753]">{businessName(businessesList.find((business) => business.id === closeoutAlerts[0].businessId), lang)} آ· {formatCalendarDate(closeoutAlerts[0].date, lang)} آ· {lang === "ar" ? closeoutAlerts[0].employeeNameAr : closeoutAlerts[0].employeeNameEn}</p><p className="mt-1 text-taq-meta font-bold text-[#827762]">{text(lang, "closeoutInAppHint")}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => onReviewCloseout(closeoutAlerts[0])} className="rounded-xl bg-white py-2.5 text-taq-meta font-black text-[#257844] ring-1 ring-[#39A160]/15">{text(lang, "reviewCloseout")}</button><button type="button" onClick={() => onDismissCloseout(closeoutAlerts[0].id)} className="rounded-xl bg-[#112A46] py-2.5 text-taq-meta font-black text-white">{text(lang, "dismissAlert")}</button></div></div>}
      {duplicateSalesAlerts.length > 0 && <div className="mx-2 mb-3 rounded-2xl bg-[#FFF1EE] p-3 ring-1 ring-[#B44747]/10"><div className="flex items-start gap-2"><Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#B44747]" /><div className="min-w-0 flex-1"><p className="text-taq-meta font-black text-[#B44747]">{text(lang, "duplicateSalesOwnerAlert")}</p><p className="mt-1 text-taq-meta font-bold text-[#716753]">{businessName(businessesList.find((business) => business.id === duplicateSalesAlerts[0].businessId), lang)} آ· {formatCalendarDate(duplicateSalesAlerts[0].date, lang)} آ· {duplicateSalesAlerts[0].entries.length} {text(lang, "summary")}</p><p className="mt-1 text-taq-meta font-bold text-[#827762]">{text(lang, "duplicateSalesOwnerHint")}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => onReviewDuplicate(duplicateSalesAlerts[0])} className="rounded-xl bg-white py-2.5 text-taq-meta font-black text-[#B44747] ring-1 ring-[#B44747]/10">{text(lang, "reviewInLog")}</button><button type="button" onClick={() => onAcknowledgeDuplicate(duplicateSalesAlerts[0])} title={text(lang, "approveMultipleSalesHint")} className="rounded-xl bg-[#112A46] py-2.5 text-taq-meta font-black text-white">{text(lang, "approveMultipleSales")}</button></div></div>}
      <Notebook fullPage theme={notebookTheme} lang={lang}>
        <NotebookHeading lang={lang} label={monthly ? text(lang, "monthlySummary") : text(lang, "dailySummary")} onShare={() => onShareNotebook({ theme: notebookTheme, period, selectedBusiness, includedBusinessIds: businessesList.map((business) => business.id), selectedDay: daySummary.id, selectedDate, selectedMonth, screen: "home", showDetails: expanded && !monthly && !isCombined })} dateSelector={<DateSelector compact lang={lang} period={period} setPeriod={changePeriod} selectedDay={selectedDay} setSelectedDay={(id) => { setSelectedDay(id); setShowAttachments(false); }} selectedDate={selectedDate} setSelectedDate={(date) => { setSelectedDate(date); setShowAttachments(false); }} fullCalendar selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />} />
        <StoreScopeTabs lang={lang} businessesList={businessesList} selectedBusiness={selectedBusiness} setSelectedBusiness={(id) => { setSelectedBusiness(id); setExpanded(false); setShowAttachments(false); }} />
        {isCombined ? (
          <div>
            {summaryLoadFailedWithoutFallback ? (
              <NotebookRow lines={3}><p className="w-full text-taq-meta font-bold text-[#B44747]">{summaryLoadErrorMessage}</p></NotebookRow>
            ) : (
              <>
                <StoreComparison lang={lang} monthly={monthly} reviewEnabled={reviewEnabled} businessesList={comparisonBusinesses} />
                <NotebookRow lines={2}><p className="w-full text-taq-meta font-bold text-[#806528]">{text(lang, "chooseStoreForDetails")}</p></NotebookRow>
              </>
            )}
          </div>
        ) : (
          <div>
            {summaryLoadFailedWithoutFallback ? (
              <NotebookRow lines={3}><p className="w-full text-taq-meta font-bold text-[#B44747]">{summaryLoadErrorMessage}</p></NotebookRow>
            ) : (
              <>
                <NotebookRow><NumberLine lang={lang} handwritten label={text(lang, "sales")} value={money(result.sales, lang)} /></NotebookRow>
                <NotebookRow><NumberLine lang={lang} handwritten label={text(lang, "purchasesExpenses")} value={money(result.expense, lang)} valueClassName="text-[#B44747]" /></NotebookRow>
                <NotebookRow><div className="flex w-full items-end justify-between text-xs font-bold text-[#806528]"><span>{text(lang, "outflowRatio")}</span><strong className="text-[#B44747]">{result.ratio}</strong></div></NotebookRow>
                <NotebookRow strong lines={2}><div className="flex w-full items-end justify-between"><span className="text-sm font-extrabold">{monthly ? text(lang, "recordedMonthResult") : text(lang, "netMovement")}</span><strong className={`tabular-nums text-2xl font-extrabold ${result.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}><MoneyValue value={money(result.net, lang)} /></strong></div></NotebookRow>
                <NotebookRow>{monthly ? <div className="flex w-full items-end justify-between text-xs font-bold text-[#806528]"><span>{text(lang, "attachments")}</span><span>{result.proofs}{reviewEnabled && <> آ· <span className="text-[#B96725]">{result.pending} {text(lang, "notReviewed")}</span></>}</span></div> : <button onClick={() => setShowAttachments(!showAttachments)} className="flex w-full items-end justify-between text-xs font-bold text-[#806528]"><span className="relative pb-1">{text(lang, "attachments")}{showAttachments && <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] rounded-full bg-[#C28A30]" />}</span><span>{result.proofs}{reviewEnabled && <> آ· <span className="text-[#B96725]">{result.pending} {text(lang, "notReviewed")}</span></>}</span></button>}</NotebookRow>
                {!monthly && showAttachments && <DayAttachments lang={lang} group={attachmentGroup} reviewEnabled={reviewEnabledForBusiness(currentBusiness.id)} onOpenOperation={onOpenOperation} />}
                <NotebookRow className="justify-center"><InkTab active={expanded} showActiveUnderline={false} onClick={() => setExpanded(!expanded)} className="inline-flex items-center gap-1">{expanded ? text(lang, "hideDetails") : text(lang, "showMore")}{expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</InkTab></NotebookRow>
              </>
            )}
          </div>
        )}
      </Notebook>
      {!isCombined && expanded && !monthly && (
        <div className={`mt-1 pb-3 ${lang === "ar" ? "pr-11 pl-6" : "pl-11 pr-6"}`}>
          <div className="flex h-[44px] items-end pb-[8px]">
            <h3 className="text-taq-body-sm font-black text-[#112A46]">
              {text(lang, "operations")} {fullDate(daySummary, lang)}
            </h3>
          </div>
          {visibleDayOperations.length ? (
            <div>
              {visibleDayOperations.map((item, index) => {
                const isSale = item.type === "summary";
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onOpenOperation(item)}
                    className="grid w-full grid-cols-[max-content_minmax(0,1fr)] items-center gap-4 py-3 text-start transition hover:bg-[#FFF4D2]/30"
                  >
                    <strong dir="ltr" className={`min-w-[74px] whitespace-nowrap text-start tabular-nums text-taq-body-sm font-black ${entryIsVoided(item) ? "text-[#A99D87] line-through" : isSale ? "text-[#257844]" : "text-[#B44747]"}`}>
                      <MoneyValue value={money(signedEntryAmount(item), lang)} />
                    </strong>
                    <span className="min-w-0 text-end">
                      <span className="flex items-center justify-end gap-2 text-taq-body-sm font-bold text-[#112A46]">
                        {operationDisplayLabel(item, lang)}
                        {entryIsVoided(item) && <Badge tone="warning">{text(lang, "voided")}</Badge>}
                      </span>
                      <small className="mt-1 block truncate text-taq-meta font-bold text-[#8A816F]">
                        {opTime(item, lang)} آ· {entryHasAttachment(item) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="flex h-[44px] items-end pb-[8px] text-xs font-bold text-[#827762]">{text(lang, "noEntriesDay")}</p>
          )}
        </div>
      )}
    </motion.section>
  );
}

function DayAttachments({ lang, group, reviewEnabled = false, onOpenOperation = () => {} }) { if (!group?.items?.length) return <NotebookRow><p className="text-xs font-bold text-[#806528]">{text(lang, "noAttachmentsDay")}</p></NotebookRow>; return <div className="py-3"><div className="flex gap-3 overflow-x-auto pb-1">{group.items.map((item) => <button key={item.id} onClick={() => onOpenOperation(item.entry)} className="min-w-[78px] text-center"><div className="mb-1 flex h-14 justify-center overflow-hidden rounded-xl"><AttachmentPreview attachment={item.attachment} className="h-14 w-14 rounded-xl" /></div><p className="truncate text-taq-meta font-bold">{lang === "ar" ? item.title : item.titleEn}</p><p className={`mt-0.5 text-taq-meta font-black ${item.entry.type === "summary" ? "text-[#257844]" : "text-[#B44747]"}`}><MoneyValue value={money(signedEntryAmount(item.entry), lang)} /></p>{reviewEnabled && !entryIsVoided(item.entry) && !item.reviewed && <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#B96725]" />}</button>)}</div></div>; }

function LogFilterChip({ active, children, onClick, tone = "default" }) {
  const toneClass = {
    default: active ? "bg-[#112A46] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
    accent: active ? "bg-[#E4B84A] text-[#112A46]" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
    warn: active ? "bg-[#B96725] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
    danger: active ? "bg-[#B44747] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
    navy: active ? "bg-[#214B7B] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
  }[tone];
  return <button type="button" onClick={onClick} className={`rounded-full px-2.5 py-1 text-taq-meta font-black ${toneClass}`}>{children}</button>;
}

function RegisterFiltersSheet({ lang, open, onClose, onApply, draft, setDraft, typeItems, expenseCategoryItems, actorOptions, salesChannelOptions }) {
  if (!open) return null;
  const selectDraftType = (nextType) => {
    setDraft((current) => ({
      ...current,
      type: nextType,
      expenseCategory: nextType !== "expense" ? "all" : current.expenseCategory,
    }));
  };
  const activeDraftCount = registerLogFilterCount(draft);

  const sheet = (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[220] flex items-center justify-center bg-[#112A46]/45 p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button type="button" onClick={onClose} className="absolute inset-0" aria-label={text(lang, "close")} />
        <motion.div dir={lang === "ar" ? "rtl" : "ltr"} initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }} className="relative z-10 flex max-h-[min(72dvh,520px)] w-full max-w-[400px] flex-col overflow-hidden rounded-[24px] bg-[#F8F6F0] shadow-[0_18px_48px_rgba(17,42,70,0.22)]">
          <div className="flex shrink-0 items-center justify-between border-b border-[#ECE6DA] px-5 py-4 text-start">
            <div>
              <p className="text-taq-meta font-bold text-[#827762]">{lang === "ar" ? "تصفية السجل" : "Log filters"}</p>
              <h3 className="text-base font-black text-[#112A46]">{lang === "ar" ? "الفلاتر" : "Filters"}</h3>
            </div>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]" aria-label={text(lang, "close")}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="mb-4">
              <p className="mb-1.5 text-taq-nav font-bold text-[#957D43]">{text(lang, "logStatus")}</p>
              <div className="flex flex-wrap gap-1.5">
                {[{ id: "all", label: "all", tone: "default" }, { id: "active", label: "activeEntries", tone: "default" }, { id: "voided", label: "voided", tone: "danger" }].map((item) => (
                  <LogFilterChip key={item.id} active={draft.status === item.id} tone={item.tone} onClick={() => setDraft((current) => ({ ...current, status: item.id }))}>{text(lang, item.label)}</LogFilterChip>
                ))}
                <LogFilterChip active={draft.attachmentOnly} tone="accent" onClick={() => setDraft((current) => ({ ...current, attachmentOnly: !current.attachmentOnly, pendingReviewOnly: current.attachmentOnly ? false : current.pendingReviewOnly }))}>{text(lang, "withAttachment")}</LogFilterChip>
                <LogFilterChip active={draft.pendingReviewOnly} tone="warn" onClick={() => setDraft((current) => ({ ...current, pendingReviewOnly: !current.pendingReviewOnly, attachmentOnly: !current.pendingReviewOnly ? true : current.attachmentOnly, status: !current.pendingReviewOnly ? "active" : current.status }))}>{text(lang, "pendingReviewOnly")}</LogFilterChip>
              </div>
            </div>
            <div className="mb-4">
              <p className="mb-1.5 text-taq-nav font-bold text-[#957D43]">{text(lang, "logType")}</p>
              <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-0.5">{typeItems.map((item) => <InkTab key={item.id} className="text-taq-meta pb-1.5" active={draft.type === item.id} onClick={() => selectDraftType(item.id)}>{text(lang, item.label)}</InkTab>)}</div>
            </div>
            <div className="mb-4">
              <p className="mb-1.5 text-taq-nav font-bold text-[#957D43]">{lang === "ar" ? "قناة البيع" : "Sales channel"}</p>
              <div className="flex flex-wrap gap-1.5">
                {salesChannelOptions.map((item) => (
                  <LogFilterChip key={item.id} active={draft.salesChannel === item.id} tone={draft.salesChannel === item.id ? "navy" : "default"} onClick={() => setDraft((current) => ({ ...current, salesChannel: item.id }))}>
                    {item.label}
                  </LogFilterChip>
                ))}
              </div>
            </div>
            {draft.type === "expense" && (
              <div className="mb-4">
                <p className="mb-1.5 text-taq-nav font-bold text-[#957D43]">{text(lang, "filterByCategory")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {expenseCategoryItems.map((item) => (
                    <LogFilterChip key={item.id} active={draft.expenseCategory === item.id} tone={draft.expenseCategory === item.id ? "danger" : "default"} onClick={() => setDraft((current) => ({ ...current, expenseCategory: item.id }))}>{text(lang, item.label)}</LogFilterChip>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="mb-1.5 text-taq-nav font-bold text-[#957D43]">{lang === "ar" ? "من قام بالإدخال" : "Entered by"}</p>
              <div className="flex flex-wrap gap-1.5">
                {actorOptions.map((item) => (
                  <LogFilterChip key={item.id} active={draft.actor === item.id} tone={draft.actor === item.id ? "navy" : "default"} onClick={() => setDraft((current) => ({ ...current, actor: item.id }))}>
                    {item.label}
                  </LogFilterChip>
                ))}
              </div>
            </div>
          </div>
          <div className="shrink-0 border-t border-[#ECE6DA] px-5 py-4">
            <div className="mb-2 flex items-center justify-between text-taq-meta font-bold text-[#827762]">
              <span>{lang === "ar" ? "فلاتر مفعّلة" : "Active filters"}</span>
              <span className="rounded-full bg-[#112A46] px-2 py-0.5 text-taq-meta font-black text-white">{activeDraftCount}</span>
            </div>
            <div className={`grid gap-3 ${lang === "ar" ? "grid-cols-[1.35fr_0.95fr]" : "grid-cols-[0.95fr_1.35fr]"}`}>
              {lang === "ar" ? (
                <>
                  <button type="button" onClick={onApply} className="rounded-2xl bg-[#112A46] py-3 text-xs font-black text-white">{text(lang, "applyFilters")}</button>
                  <button type="button" onClick={() => setDraft({ ...DEFAULT_REGISTER_LOG_FILTERS })} className="rounded-2xl bg-white py-3 text-xs font-black ring-1 ring-black/[0.06]">{text(lang, "resetFilters")}</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setDraft({ ...DEFAULT_REGISTER_LOG_FILTERS })} className="rounded-2xl bg-white py-3 text-xs font-black ring-1 ring-black/[0.06]">{text(lang, "resetFilters")}</button>
                  <button type="button" onClick={onApply} className="rounded-2xl bg-[#112A46] py-3 text-xs font-black text-white">{text(lang, "applyFilters")}</button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
  if (typeof document === "undefined") return null;
  return createPortal(sheet, document.body);
}

function LogStoreFilter({ lang, businessesList = businesses, selectedBusiness, setSelectedBusiness, locked = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filterRef = useRef(null);
  const selectedStore = businessesList.find((business) => business.id === selectedBusiness) || null;
  useEffect(() => {
    if (!locked && businessesList.length === 1 && selectedBusiness !== businessesList[0].id) setSelectedBusiness(businessesList[0].id);
  }, [locked, businessesList, selectedBusiness, setSelectedBusiness]);
  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => { if (filterRef.current && !filterRef.current.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);
  if (businessesList.length <= 1) {
    if (!businessesList[0]) return null;
    return (
      <NotebookRow className="justify-center">
        <p className="text-xs font-black text-[#806528]">{businessName(businessesList[0], lang, true) || businessName(businessesList[0], lang)}</p>
      </NotebookRow>
    );
  }
  const stores = locked
    ? businessesList.map((business) => ({ id: business.id, label: businessName(business, lang, true) || businessName(business, lang) }))
    : [{ id: "all", label: text(lang, "allStores") }, ...businessesList.map((business) => ({ id: business.id, label: businessName(business, lang, true) || businessName(business, lang) }))];
  if (locked || businessesList.length <= 2) {
    return (
      <NotebookRow>
        <div className={`grid w-full items-end gap-2 ${stores.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
          {stores.map((store) => {
            const active = selectedBusiness === store.id;
            return (
              <button key={store.id} type="button" disabled={locked} onClick={() => setSelectedBusiness(store.id)} className={`relative min-w-0 pb-2 text-center text-xs font-black transition ${active ? "text-[#B44747]" : "text-[#957D43]"} ${locked ? "cursor-default" : ""}`}>
                <span className="relative inline-flex whitespace-nowrap">{store.label}{active && <span className="absolute -bottom-[9px] left-0 right-0 h-[2px] rounded-full bg-[#C28A30]" />}</span>
              </button>
            );
          })}
        </div>
      </NotebookRow>
    );
  }
  const filtered = businessesList.filter((business) => `${businessName(business, lang)} ${businessLocation(business, lang)}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <NotebookRow className="justify-center">
      <div ref={filterRef} className="relative pb-[8px]">
        <button type="button" onClick={() => setOpen(!open)} className={`inline-flex max-w-[238px] items-center justify-center gap-1.5 rounded-full px-3 py-1 text-taq-meta font-bold transition ${open ? "text-[#B44747]" : "text-[#806528]"}`}>
          <span className="truncate">{selectedBusiness === "all" ? text(lang, "allStores") : businessName(selectedStore, lang)}</span>
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition ${open ? "rotate-180 text-[#B44747]" : "text-[#806528]"}`} />
        </button>
        <AnimatePresence>{open && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute left-1/2 top-[38px] z-40 w-[270px] -translate-x-1/2 rounded-2xl bg-[#FFFDF7] p-3 shadow-xl ring-1 ring-[#D8CCA8]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text(lang, "searchStore")} className="mb-2 w-full rounded-xl bg-[#F7F5EF] px-3 py-2.5 text-taq-meta font-bold outline-none" />
          <button type="button" onClick={() => { setSelectedBusiness("all"); setOpen(false); setQuery(""); }} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold ${selectedBusiness === "all" ? "bg-[#FFF0CB] text-[#B44747]" : "text-[#112A46]"}`}><span>{text(lang, "allStores")}</span>{selectedBusiness === "all" && <Check className="h-4 w-4" />}</button>
          <div className="max-h-48 overflow-y-auto">{filtered.map((business) => <button key={business.id} type="button" onClick={() => { setSelectedBusiness(business.id); setOpen(false); setQuery(""); }} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start ${selectedBusiness === business.id ? "bg-[#FFF0CB]" : ""}`}><div><p className="text-taq-meta font-black text-[#112A46]">{businessName(business, lang)}</p><p className="text-taq-nav font-bold text-[#827762]">{businessLocation(business, lang)}</p></div>{selectedBusiness === business.id && <Check className="h-4 w-4 text-[#B44747]" />}</button>)}</div>
        </motion.div>}</AnimatePresence>
      </div>
    </NotebookRow>
  );
}

function OwnerRegisterScreen({ lang, onOpenOperation = () => {}, operationalEntries = [], selectedBusiness = "all", setSelectedBusiness = () => {}, businessesList = businesses, archivedBusinessIds = [], archivedReadOnlyBusinessId = null, reviewFocus = null, attachmentReviewRequest = null, notebookTheme = "yellow", registerEntriesApiEnabled = false, registerEntriesApiOrganizationId = "", registerEntriesApiActorUserId = "", registerEntriesApiActorRole = "owner", registerEntriesRefreshKey = 0, registerEntriesSyncError = "", closeoutsSyncError = "" }) {
  const [period, setPeriod] = useState("day");
  const [selectedDate, setSelectedDate] = useState(() => todayIsoDate());
  const [selectedMonth, setSelectedMonth] = useState(() => todayIsoDate().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [customFrom, setCustomFrom] = useState(() => `${new Date().getFullYear()}-01-01`);
  const [customTo, setCustomTo] = useState(() => todayIsoDate());
  const [logFilters, setLogFilters] = useState(DEFAULT_REGISTER_LOG_FILTERS);
  const [draftLogFilters, setDraftLogFilters] = useState(DEFAULT_REGISTER_LOG_FILTERS);
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const [logView, setLogView] = useState("closeouts");
  const [expandedEntryId, setExpandedEntryId] = useState(null);
  const [expandedCloseoutKey, setExpandedCloseoutKey] = useState(null);

  const openFiltersSheet = () => {
    setDraftLogFilters(logFilters);
    setFiltersSheetOpen(true);
  };
  const closeFiltersSheet = () => setFiltersSheetOpen(false);
  const applyFiltersSheet = () => {
    setLogFilters(draftLogFilters);
    setFiltersSheetOpen(false);
  };

  useEffect(() => {
    if (!reviewFocus?.businessId || !reviewFocus?.date || archivedReadOnlyBusinessId) return;
    setSelectedBusiness(reviewFocus.businessId);
    setPeriod("day");
    setSelectedDate(reviewFocus.date);
    setLogFilters({ ...DEFAULT_REGISTER_LOG_FILTERS, status: "active", type: "summary" });
  }, [reviewFocus, archivedReadOnlyBusinessId, setSelectedBusiness]);

  useEffect(() => {
    if (!attachmentReviewRequest?.businessId || !attachmentReviewRequest?.date || archivedReadOnlyBusinessId) return;
    setSelectedBusiness(attachmentReviewRequest.businessId);
    setPeriod("day");
    setSelectedDate(attachmentReviewRequest.date);
    setLogFilters({ ...DEFAULT_REGISTER_LOG_FILTERS, status: "active", attachmentOnly: true, pendingReviewOnly: true });
  }, [attachmentReviewRequest, archivedReadOnlyBusinessId, setSelectedBusiness]);

  const activeBusinesses = businessesList.filter((business) => !archivedBusinessIds.includes(business.id));
  const archivedReadOnlyBusiness = archivedReadOnlyBusinessId && archivedBusinessIds.includes(archivedReadOnlyBusinessId) ? businessesList.find((business) => business.id === archivedReadOnlyBusinessId) : null;
  const availableBusinesses = archivedReadOnlyBusiness ? [archivedReadOnlyBusiness] : activeBusinesses;
  const safeBusinessId = archivedReadOnlyBusiness ? archivedReadOnlyBusiness.id : activeBusinesses.length === 1 ? activeBusinesses[0].id : selectedBusiness === "all" || activeBusinesses.some((business) => business.id === selectedBusiness) ? selectedBusiness : "all";
  const registerTargetStoreIds = useMemo(
    () => (safeBusinessId === "all" ? activeBusinesses.map((business) => business.id) : [safeBusinessId]),
    [activeBusinesses, safeBusinessId],
  );
  const {
    entries: apiRegisterEntries,
    error: apiRegisterEntriesError,
    hasMore: apiRegisterEntriesHasMore,
    loadMore: loadMoreRegisterEntries,
    loadAllRemaining: loadAllRegisterEntries,
  } = useRegisterEntriesFromApi({
    enabled: registerEntriesApiEnabled,
    organizationId: registerEntriesApiOrganizationId,
    actorUserId: registerEntriesApiActorUserId,
    actorRole: registerEntriesApiActorRole,
    storeIds: registerTargetStoreIds,
    period,
    selectedDate,
    selectedMonth,
    selectedYear,
    customFrom,
    customTo,
    refreshKey: registerEntriesRefreshKey,
  });
  const localPeriodEntries = useMemo(
    () => operationalEntries.filter((entry) => (safeBusinessId === "all" ? activeBusinesses.some((business) => business.id === entry.businessId) : entry.businessId === safeBusinessId) && entryDateMatches(entry, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo)),
    [activeBusinesses, customFrom, customTo, operationalEntries, period, safeBusinessId, selectedDate, selectedMonth, selectedYear],
  );
  const periodEntries = registerEntriesApiEnabled
    ? apiRegisterEntries
    : localPeriodEntries;
  const registerEntriesLoadError = registerEntriesApiEnabled && (apiRegisterEntriesError || registerEntriesSyncError);
  const closeoutsLoadError = registerEntriesApiEnabled && (apiRegisterEntriesError || registerEntriesSyncError || closeoutsSyncError);
  const registerEntriesLoadErrorMessage = lang === "ar"
    ? "تعذر تحميل العمليات من الخادم. لم يتم عرض بيانات محلية بديلة."
    : "Failed to load operations from the server. No local fallback data is shown.";
  const closeoutsLoadErrorMessage = lang === "ar"
    ? "تعذر تحميل التقفيلات من الخادم. لم يتم عرض بيانات محلية بديلة."
    : "Failed to load closeouts from the server. No local fallback data is shown.";
  const registerLoadMoreRef = useRef(null);
  useEffect(() => {
    if (!registerEntriesApiEnabled || logView !== "operations" || !apiRegisterEntriesHasMore) return undefined;
    const target = registerLoadMoreRef.current;
    if (!target) return undefined;
    const observer = new IntersectionObserver((records) => {
      if (records.some((record) => record.isIntersecting)) {
        loadMoreRegisterEntries();
      }
    }, { root: null, rootMargin: "240px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [apiRegisterEntriesHasMore, loadMoreRegisterEntries, logView, periodEntries.length, registerEntriesApiEnabled]);
  useEffect(() => {
    if (!registerEntriesApiEnabled || logView !== "closeouts" || !apiRegisterEntriesHasMore) return undefined;
    loadAllRegisterEntries();
    return undefined;
  }, [apiRegisterEntriesHasMore, loadAllRegisterEntries, logView, registerEntriesApiEnabled, registerEntriesRefreshKey, safeBusinessId, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo]);
  const actorOptions = useMemo(() => {
    const seen = new Set();
    const options = [{ id: "all", label: lang === "ar" ? "الكل" : "All" }];
    periodEntries.forEach((entry) => {
      const actorId = entry.enteredBy?.userId;
      if (!actorId || seen.has(actorId)) return;
      seen.add(actorId);
      options.push({
        id: actorId,
        label: employeeDisplayName(entry, lang) || (lang === "ar" ? "مستخدم" : "User"),
      });
    });
    return options;
  }, [periodEntries, lang]);
  const salesChannelOptions = useMemo(
    () => buildRegisterSalesChannelOptions(
      periodEntries,
      (row) => {
        const fallback = channels.find((channel) => channel.id === row.channelId);
        return row.name || (fallback ? channelName(fallback, lang) : row.channelId);
      },
      lang === "ar" ? "كل القنوات" : "All channels",
    ),
    [periodEntries, lang],
  );
  const filteredEntries = useMemo(
    () => filterRegisterLogEntries(periodEntries, logFilters, entryCategory),
    [periodEntries, logFilters],
  );
  const visibleEntries = newestEntries(filteredEntries);
  const {
    sameDayCloseoutCountByStoreDate,
    daySequenceByCloseoutId,
  } = useMemo(
    () => buildRegisterCloseoutDayContext(periodEntries, { trustServerDaySequenceOnly: ENTRIES_API_DB_SOURCE }),
    [periodEntries],
  );
  const closeoutSummaries = useMemo(
    () => buildRegisterCloseoutSummaries({
      filteredEntries,
      salesChannelFilter: logFilters.salesChannel,
      resolveChannelName: (row) => {
        const fallback = channels.find((channel) => channel.id === row.channelId);
        return row.name || (fallback ? channelName(fallback, lang) : row.channelId);
      },
      resolveStore: (businessId) => businessesList.find((business) => business.id === businessId) || null,
      resolveActorLabel: (group) => {
        const ownerEntered = group.entries.find((entry) => entry.enteredBy?.userId === ownerActor.userId) || group.entries[0];
        return employeeDisplayName(ownerEntered, lang) || text(lang, "enteredByOwner");
      },
    }),
    [filteredEntries, businessesList, lang, logFilters.salesChannel],
  );
  useEffect(() => {
    if (!visibleEntries.length) {
      setExpandedEntryId(null);
      return;
    }
    setExpandedEntryId((current) => (current && visibleEntries.some((entry) => entry.id === current) ? current : null));
  }, [visibleEntries]);
  useEffect(() => {
    if (!closeoutSummaries.length) {
      setExpandedCloseoutKey(null);
      return;
    }
    setExpandedCloseoutKey((current) => (current && closeoutSummaries.some((summary) => summary.key === current) ? current : null));
  }, [closeoutSummaries]);
  const registerScrollId = (value) => `${value}`.replace(/[|]/g, "--");
  useEffect(() => {
    const targetId = expandedCloseoutKey
      ? `register-closeout-${registerScrollId(expandedCloseoutKey)}`
      : expandedEntryId
        ? `register-entry-${expandedEntryId}`
        : null;
    if (!targetId) return undefined;
    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [expandedCloseoutKey, expandedEntryId]);

  const typeItems = [{ id: "all", label: "allTypes" }, { id: "summary", label: "summary" }, { id: "purchases", label: "purchases" }, { id: "expense", label: "expense" }, { id: "withdrawal", label: "withdrawal" }];
  const expenseCategoryItems = [{ id: "all", label: "allCategories" }, ...expenseCategories];
  const activeFilterCount = registerLogFilterCount(logFilters);
  const registerCardStyle = useMemo(() => ({ backgroundColor: notebookCardBackground(notebookTheme) }), [notebookTheme]);
  const registerCardInsetStyle = useMemo(() => ({ backgroundColor: notebookCardBackground(notebookTheme, "inset") }), [notebookTheme]);
  const registerPeriodSummary = useMemo(
    () => summarizeRegisterPeriod(
      filteredEntries,
      logFilters.salesChannel,
      salesChannelOptions,
      lang === "ar" ? "قناة" : "Channel",
    ),
    [filteredEntries, lang, logFilters.salesChannel, salesChannelOptions],
  );
  const registerPeriodLabel = logPeriodScopeLabel(lang, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo);

  return (
    <NotebookScrollSurface theme={notebookTheme} lang={lang}>
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-owner-page taq-notebook-body pb-28 pt-1">
        {archivedReadOnlyBusiness && <div className="mx-2 mb-2 flex justify-center"><Badge tone="warning">{text(lang, "archivedReadOnly")}</Badge></div>}
        <NotebookHeading
          lang={lang}
          label={text(lang, "operationsLog")}
          dateSelector={(
            <DateSelector
              compact
              lang={lang}
              period={period}
              setPeriod={setPeriod}
              allowedPeriods={["day", "month", "year", "custom"]}
              selectedDay={selectedDate}
              setSelectedDay={() => {}}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              fullCalendar
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              customFrom={customFrom}
              setCustomFrom={setCustomFrom}
              customTo={customTo}
              setCustomTo={setCustomTo}
            />
          )}
        />

        <div className={`${lang === "ar" ? "pr-11 pl-6" : "pl-11 pr-6"}`}>
          <LogStoreFilter lang={lang} businessesList={availableBusinesses} selectedBusiness={safeBusinessId} setSelectedBusiness={setSelectedBusiness} locked={Boolean(archivedReadOnlyBusiness)} />
          <NotebookRow className="mb-1">
            <div className="flex w-full items-end justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-end gap-4">
                <InkTab active={logView === "closeouts"} onClick={() => setLogView("closeouts")} className="text-taq-meta pb-1.5">
                  {lang === "ar" ? "التقفيلات" : "Closeouts"}
                </InkTab>
                <InkTab active={logView === "operations"} onClick={() => setLogView("operations")} className="text-taq-meta pb-1.5">
                  {lang === "ar" ? "العمليات" : "Operations"}
                </InkTab>
              </div>
              <InkTab active={activeFilterCount > 0} onClick={openFiltersSheet} className="inline-flex shrink-0 items-center gap-1 pb-1.5 text-taq-meta">
                {text(lang, "logFilters")}
                {activeFilterCount > 0 ? <span className="tabular-nums">({activeFilterCount})</span> : null}
              </InkTab>
            </div>
          </NotebookRow>
        </div>

        <RegisterFiltersSheet
          lang={lang}
          open={filtersSheetOpen}
          onClose={closeFiltersSheet}
          onApply={applyFiltersSheet}
          draft={draftLogFilters}
          setDraft={setDraftLogFilters}
          typeItems={typeItems}
          expenseCategoryItems={expenseCategoryItems}
          actorOptions={actorOptions}
          salesChannelOptions={salesChannelOptions}
        />

        <article className="mb-3 overflow-hidden rounded-[19px] border border-[#E8E1D4] px-3.5 py-3 shadow-[0_8px_18px_rgba(17,42,70,0.06)]" style={registerCardStyle}>
          <p className="text-taq-meta font-black text-[#112A46]">{text(lang, "registerPeriodSummary")}</p>
          <p className="mt-0.5 text-taq-nav font-bold text-[#827762]">{registerPeriodLabel}</p>
          {registerPeriodSummary.mode === "channel" ? (
            <div className="mt-3 flex items-end justify-between gap-3 border-t border-dashed border-[#DDD3C0] pt-2.5">
              <span className="text-taq-meta font-black text-[#716753]">{registerPeriodSummary.label}</span>
              <strong className="tabular-nums text-taq-body-sm font-extrabold text-[#257844]">
                <MoneyValue value={money(registerPeriodSummary.amount, lang)} />
              </strong>
            </div>
          ) : (
            <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-dashed border-[#DDD3C0] pt-2.5">
              <p className="text-taq-meta font-black text-[#112A46]">
                {lang === "ar" ? "الداخل" : "In"}
                {" "}
                <span className="tabular-nums"><MoneyValue value={money(registerPeriodSummary.sales, lang)} /></span>
              </p>
              <p className="text-taq-meta font-black text-[#B44747]">
                {lang === "ar" ? "الخارج" : "Out"}
                {" "}
                <span className="tabular-nums"><MoneyValue value={money(registerPeriodSummary.expense, lang)} /></span>
              </p>
              <p className={`text-taq-meta font-black ${registerPeriodSummary.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}>
                {lang === "ar" ? "الناتج" : "Net"}
                {" "}
                <span className="tabular-nums"><MoneyValue value={money(registerPeriodSummary.net, lang)} /></span>
              </p>
            </div>
          )}
        </article>

        <div className="mb-3 flex items-center justify-between px-1 text-taq-meta font-black text-[#8B8274]">
          <span>{text(lang, "logResults")}</span>
          <span>{logView === "operations" ? `${visibleEntries.length} ${text(lang, "operations")}` : `${closeoutSummaries.length} ${lang === "ar" ? "تقفيلات" : "Closeouts"}`}</span>
        </div>

        {logView === "operations" && (registerEntriesLoadError ? (
          <div className="rounded-2xl px-4 py-8 text-center text-taq-meta font-bold text-[#B44747] ring-1 ring-[#B44747]/10" style={registerCardStyle}>{registerEntriesLoadErrorMessage}</div>
        ) : visibleEntries.length === 0 ? (
          <div className="rounded-2xl px-4 py-8 text-center text-taq-meta font-bold text-[#827762] ring-1 ring-[#E8E1D4]" style={registerCardStyle}>{text(lang, "noOperationsMatch")}</div>
        ) : (
          <div className="space-y-2.5">
            {visibleEntries.map((entry) => {
              const store = businessesList.find((business) => business.id === entry.businessId);
              const isSale = entry.type === "summary";
              const signedAmount = isSale
                ? summaryEntryDisplayAmount(entry, logFilters.salesChannel)
                : -entry.amount;
              const isExpanded = expandedEntryId === entry.id;
              const actorLabel = employeeDisplayName(entry, lang) || (lang === "ar" ? "مستخدم" : "User");
              const registerDaySequence = entry.closeoutId
                ? (Number.isInteger(entry.daySequence) ? entry.daySequence : daySequenceByCloseoutId.get(entry.closeoutId) ?? null)
                : null;
              const registerSameDayCloseoutCount = entry.closeoutId
                ? sameDayCloseoutCountByStoreDate.get(`${entry.businessId}|${entry.date}`) || 1
                : 1;
              const registerDateLabel = formatCloseoutDayLabel({
                formattedDate: formatCalendarDate(entry.date, lang),
                daySequence: registerDaySequence,
                sameDayCloseoutCount: registerSameDayCloseoutCount,
              });
              return (
                <article id={`register-entry-${entry.id}`} key={entry.id} className="overflow-hidden rounded-[19px] border border-[#E8E1D4] shadow-[0_8px_18px_rgba(17,42,70,0.06)]" style={registerCardStyle}>
                  <button type="button" onClick={() => setExpandedEntryId((current) => (current === entry.id ? null : entry.id))} className="flex w-full items-start gap-2.5 px-3.5 py-3 text-start">
                    <span className={`mt-0.5 h-8 w-1 shrink-0 rounded-full ${isSale ? "bg-[#39A160]" : "bg-[#E4B84A]"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-taq-meta font-black text-[#112A46]">{operationDisplayLabel(entry, lang, logFilters.salesChannel)}</p>
                        {entryIsVoided(entry) && <Badge tone="warning">{text(lang, "voided")}</Badge>}
                        {entryHasAttachment(entry) && <Badge tone="navy">{text(lang, "attachmentExists")}</Badge>}
                      </div>
                      <p className="mt-1 truncate text-taq-nav font-bold text-[#827762]">{registerDateLabel} آ· {opTime(entry, lang)} آ· {businessName(store, lang, true) || businessName(store, lang)} آ· {actorLabel}</p>
                    </div>
                    <div className="shrink-0 text-end">
                      <strong className={`block tabular-nums text-taq-meta font-black ${entryIsVoided(entry) ? "text-[#A99D87] line-through" : isSale ? "text-[#257844]" : "text-[#B44747]"}`}>
                        <MoneyValue value={money(signedAmount, lang)} />
                      </strong>
                      <span className="mt-1 block text-taq-meta font-black text-[#806528]">{isExpanded ? (lang === "ar" ? "إخفاء" : "Hide") : (lang === "ar" ? "تفاصيل" : "Details")}</span>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-[#E8E1D4] px-3.5 py-3" style={registerCardInsetStyle}>
                      {entry.note ? <p className="mb-2 text-taq-meta font-bold text-[#716753]">{entry.note}</p> : null}
                      {entryIsVoided(entry) && entry.voidReason ? <p className="mb-2 text-taq-meta font-bold text-[#B44747]">{text(lang, "voidReason")}: {entry.voidReason}</p> : null}
                      <div className="grid grid-cols-2 gap-2 text-taq-meta font-bold text-[#716753]">
                        <div className="rounded-xl px-2.5 py-2 ring-1 ring-[#E8E1D4]" style={registerCardStyle}>{lang === "ar" ? "المدخل" : "Entered by"}: {actorLabel}</div>
                        <div className="rounded-xl px-2.5 py-2 ring-1 ring-[#E8E1D4]" style={registerCardStyle}>{lang === "ar" ? "المحل" : "Store"}: {businessName(store, lang, true) || businessName(store, lang)}</div>
                      </div>
                      <button type="button" onClick={() => onOpenOperation(entry)} className="mt-2.5 w-full rounded-xl bg-[#112A46] py-2.5 text-taq-meta font-black text-white">{lang === "ar" ? "عرض العملية" : "Open operation"}</button>
                    </div>
                  )}
                </article>
              );
            })}
            {registerEntriesApiEnabled && logView === "operations" && apiRegisterEntriesHasMore ? (
              <div ref={registerLoadMoreRef} className="h-px w-full shrink-0" aria-hidden="true" />
            ) : null}
          </div>
        ))}

        {logView === "closeouts" && (closeoutsLoadError ? (
          <div className="rounded-2xl px-4 py-8 text-center text-taq-meta font-bold text-[#B44747] ring-1 ring-[#B44747]/10" style={registerCardStyle}>{closeoutsLoadErrorMessage}</div>
        ) : closeoutSummaries.length === 0 ? (
          <div className="rounded-2xl px-4 py-8 text-center text-taq-meta font-bold text-[#827762] ring-1 ring-[#E8E1D4]" style={registerCardStyle}>{text(lang, "noCloseoutsPeriod")}</div>
        ) : (
          <div className="space-y-2.5">
            {closeoutSummaries.map((summary) => {
              const isExpanded = expandedCloseoutKey === summary.key;
              const storeLabel = businessName(summary.store, lang, true) || businessName(summary.store, lang);
              return (
                <article id={`register-closeout-${registerScrollId(summary.key)}`} key={summary.key} className="overflow-hidden rounded-[19px] border border-[#E8E1D4] shadow-[0_8px_18px_rgba(17,42,70,0.06)]" style={registerCardStyle}>
                  <button type="button" onClick={() => setExpandedCloseoutKey((current) => (current === summary.key ? null : summary.key))} className="flex w-full items-start gap-2.5 px-3.5 py-3 text-start">
                    <ChevronDown className={`mt-0.5 h-5 w-5 shrink-0 text-[#112A46] transition ${isExpanded ? "rotate-180" : ""}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                        <p className="text-taq-meta font-black text-[#112A46]">{formatCloseoutDayLabel({ formattedDate: formatCalendarDate(summary.date, lang), daySequence: summary.daySequence, sameDayCloseoutCount: summary.sameDayCloseoutCount })}</p>
                        <p className="rounded-full border border-[#8EA1C4] px-2.5 py-1 text-taq-meta font-black text-[#214B7B]">{lang === "ar" ? `أدخلها ${summary.actorLabel}` : `Entered by ${summary.actorLabel}`}</p>
                      </div>
                      <p className="mt-1 text-taq-meta font-bold text-[#716753]">{lang === "ar" ? "تقفيلة يوم" : "Daily closeout"} آ· {storeLabel}</p>
                      <div className="mt-2 grid grid-cols-3 gap-2 border-t border-dashed border-[#DDD3C0] pt-2">
                        <p className="text-taq-meta font-black text-[#112A46]">{lang === "ar" ? "الدخل" : "In"} <span className="tabular-nums"><MoneyValue value={money(summary.displaySales, lang)} /></span></p>
                        <p className="text-taq-meta font-black text-[#B44747]">{lang === "ar" ? "الخارج" : "Out"} <span className="tabular-nums"><MoneyValue value={money(-summary.totals.expense, lang)} /></span></p>
                        <p className={`text-taq-meta font-black ${summary.totals.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}>{lang === "ar" ? "الناتج" : "Net"} <span className="tabular-nums"><MoneyValue value={money(summary.totals.net, lang)} /></span></p>
                      </div>
                      {isExpanded && (
                        summary.salesChannels.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {summary.salesChannels.map((channel) => (
                              <span key={channel.channelId} className="rounded-full bg-[#E6F5E9] px-2 py-0.5 text-taq-nav font-bold text-[#257844]">
                                {channel.name} آ· <span className="tabular-nums"><MoneyValue value={money(channel.amount, lang)} /></span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-taq-nav font-bold text-[#8B8274]">{lang === "ar" ? "لا توجد قنوات مبيعات" : "No sales channels"}</p>
                        )
                      )}
                      <p className="mt-2 text-taq-meta font-black text-[#806528]">{isExpanded ? (lang === "ar" ? "إخفاء" : "Hide") : (lang === "ar" ? "عرض" : "Show")}</p>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-[#E8E1D4] px-3.5 py-2.5" style={registerCardInsetStyle}>
                      <div className="space-y-2">
                        {summary.operations.flatMap((item) => expandRegisterCloseoutOperationRows(item, lang, logFilters.salesChannel).map((row) => (
                          <button key={row.key} type="button" onClick={() => onOpenOperation(row.item)} className="grid w-full grid-cols-[max-content_minmax(0,1fr)] items-center gap-3 rounded-xl px-2 py-2 text-start hover:bg-[#FFF4D2]/35">
                            <strong dir="ltr" className={`min-w-[70px] whitespace-nowrap text-start tabular-nums text-taq-meta font-black ${entryIsVoided(row.item) ? "text-[#A99D87] line-through" : row.isSale ? "text-[#257844]" : "text-[#B44747]"}`}>
                              <MoneyValue value={money(row.amount, lang)} />
                            </strong>
                            <span className="min-w-0 text-end">
                              <span className="truncate text-taq-meta font-bold text-[#112A46]">{row.label}</span>
                              <small className="mt-0.5 block truncate text-taq-nav font-bold text-[#8A816F]">{opTime(row.item, lang)} آ· {entryHasAttachment(row.item) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}</small>
                            </span>
                          </button>
                        )))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ))}
      </motion.section>
    </NotebookScrollSurface>
  );
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

/** Share image via OS sheet (WhatsApp on mobile). Never downloads â€” wa.me cannot attach files. */
async function shareNotebookImageToWhatsApp(file, caption, lang) {
  return shareImageThroughWhatsApp({
    file,
    caption,
    lang,
    pasteHint: text(lang, "shareImagePasteHint"),
  });
}

function NotebookShareModal({ lang, snapshot, onClose, businessesList = businesses, operationalEntries = [], archivedBusinessIds = [], notebookExportApiEnabled = false, notebookExportAuth = {} }) {
  const [format, setFormat] = useState("image");
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState("");
  const [shareHint, setShareHint] = useState("");
  const previewRef = useRef(null);
  const cachedImageFileRef = useRef(null);
  const preCaptureTokenRef = useRef(0);
  const {
    apiEntries,
    apiRecord,
    apiChannelRows,
    apiDayRows,
    apiPendingProofs,
  } = useNotebookExportShareData({
    enabled: notebookExportApiEnabled,
    auth: notebookExportAuth,
    snapshot,
  });
  useEffect(() => { if (snapshot) { setFormat("image"); setImageError(""); setShareHint(""); cachedImageFileRef.current = null; } }, [snapshot]);
  useEffect(() => {
    if (!snapshot || format !== "image") {
      cachedImageFileRef.current = null;
      return undefined;
    }
    const captureToken = ++preCaptureTokenRef.current;
    let cancelled = false;
    const paperColor = (notebookThemes[snapshot.theme] || notebookThemes.yellow).paper || "#FFFDF7";
    const filename = `${lang === "ar" ? "تقفيلة" : "Taqfeelah"}-${snapshot.screen}-${snapshot.selectedDate || todayIsoDate()}.png`;
    let timeoutId = 0;
    const frameId = requestAnimationFrame(() => {
      timeoutId = window.setTimeout(async () => {
        if (cancelled || captureToken !== preCaptureTokenRef.current || !previewRef.current) return;
        try {
          const blob = await captureNotebookPreviewBlob(previewRef.current, paperColor);
          if (!cancelled && captureToken === preCaptureTokenRef.current) {
            cachedImageFileRef.current = new File([blob], filename, { type: "image/png" });
          }
        } catch {
          if (!cancelled && captureToken === preCaptureTokenRef.current) cachedImageFileRef.current = null;
        }
      }, 400);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      clearTimeout(timeoutId);
    };
  }, [snapshot, format, lang]);
  if (!snapshot) return null;

  const sharePeriod = snapshot.period || "day";
  const monthly = sharePeriod === "month";
  const isOutflowReport = snapshot.screen === "reports" && snapshot.tab === "expenses";
  const isChannelsReport = snapshot.screen === "reports" && snapshot.tab === "channels";
  const isDaysReport = snapshot.screen === "reports" && snapshot.tab === "days";
  const isProofsReport = snapshot.screen === "reports" && snapshot.tab === "proofs";
  const activeShareBusinesses = businessesList.filter((business) => !archivedBusinessIds.includes(business.id));
  const includedBusinessIds = snapshot.includedBusinessIds || activeShareBusinesses.map((business) => business.id);
  const combined = snapshot.selectedBusiness === "all";
  const business = businessesList.find((item) => item.id === snapshot.selectedBusiness) || businessesList[0] || businesses[0];
  const shareDate = snapshot.selectedDate || todayIsoDate();
  const shareYear = snapshot.selectedYear || String(new Date().getFullYear());
  const shareFrom = snapshot.customFrom || `${shareYear}-01-01`;
  const shareTo = snapshot.customTo || todayIsoDate();
  const selectedDayItem = apiRecord
    ? {
      id: shareDate,
      dayAr: formatCalendarDate(shareDate, "ar"),
      dayEn: formatCalendarDate(shareDate, "en"),
      fullAr: formatCalendarDate(shareDate, "ar"),
      fullEn: formatCalendarDate(shareDate, "en"),
      ...apiRecord,
    }
    : summaryDayFromEntriesWithLabels(operationalEntries, business.id, shareDate);
  const selectedMonthItem = formatSelectedMonth(snapshot.selectedMonth, lang);
  const scopedShareEntries = apiEntries || operationalEntries.filter((entry) => (combined ? includedBusinessIds.includes(entry.businessId) : entry.businessId === snapshot.selectedBusiness) && entryDateMatches(entry, sharePeriod, shareDate, snapshot.selectedMonth, shareYear, shareFrom, shareTo));
  const outflowCategory = snapshot.outflowCategory || "all";
  const filteredOutflowEntries = scopedShareEntries.filter((entry) => entryIsActive(entry) && entryIsOutflow(entry) && (outflowCategory === "all" || entryCategory(entry) === outflowCategory));
  const shareChannelMap = new Map();
  if (!apiChannelRows) {
    scopedShareEntries.filter((entry) => entryIsActive(entry) && entry.type === "summary").forEach((entry) => (entry.salesChannels || []).forEach((row) => { const current = shareChannelMap.get(row.channelId) || { id: row.channelId, label: row.name || row.channelId, amount: 0 }; shareChannelMap.set(row.channelId, { ...current, amount: current.amount + row.amount }); }));
  }
  const shareChannelRows = apiChannelRows || [...shareChannelMap.values()].filter((row) => row.amount > 0);
  const shareDayRows = apiDayRows || [...new Set(scopedShareEntries.filter(entryIsActive).map((entry) => entry.date))].sort().reverse().map((date) => ({ date, ...summarizeEntries(scopedShareEntries.filter((entry) => entry.date === date)) }));
  const shareProofEntries = scopedShareEntries.filter((entry) => entryIsActive(entry) && entryHasAttachment(entry));
  const sharePendingProofs = typeof apiPendingProofs === "number" ? apiPendingProofs : shareProofEntries.filter((entry) => !entry.reviewed).length;
  const shareBusinessRows = includedBusinessIds.map((businessId) => { const item = businessesList.find((business) => business.id === businessId); return { business: item, ...summarizeEntries(scopedShareEntries.filter((entry) => entry.businessId === businessId)) }; }).filter((row) => row.business);
  const outflowTotal = filteredOutflowEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const outflowAverage = filteredOutflowEntries.length ? outflowTotal / filteredOutflowEntries.length : 0;
  const normalRecord = combined
    ? summarizeEntries(scopedShareEntries)
    : apiRecord
      ? apiRecord
      : monthly
        ? summaryMonthFromEntries(operationalEntries, business.id, snapshot.selectedMonth)
        : selectedDayItem;
  const record = isOutflowReport ? { sales: 0, expense: outflowTotal, net: -outflowTotal, ratio: "â€”" } : normalRecord;
  const ratio = record.ratio || (record.sales > 0 ? `${((record.expense / record.sales) * 100).toFixed(1)}%` : record.expense > 0 ? "â€”" : "0.0%");
  const title = combined ? text(lang, snapshot.screen === "reports" ? "combinedReport" : "combinedCloseout") : businessName(business, lang);
  const periodLabel = sharePeriod === "year" ? shareYear : sharePeriod === "custom" ? `${formatCalendarDate(shareFrom, lang)} â€” ${formatCalendarDate(shareTo, lang)}` : monthly ? selectedMonthItem : fullDate(selectedDayItem, lang);
  const outflowCategoryLabel = outflowCategory === "all" ? text(lang, "allCategories") : text(lang, outflowReportCategories.find((item) => item.id === outflowCategory)?.label || "other");
  const activeTheme = notebookThemes[snapshot.theme] || notebookThemes.yellow;
  const lines = {
    backgroundImage: `repeating-linear-gradient(180deg, transparent 0px, transparent 43px, ${activeTheme.line} 43px, ${activeTheme.line} 44px)`,
  };
  const shareCaption = combined
    ? [
        lang === "ar" ? "تقفيلة - مقارنة المحلات" : "Taqfeelah - Shops comparison",
        periodLabel,
        ...shareBusinessRows.map((row) => lang === "ar"
          ? `${businessName(row.business, lang)} | المبيعات: ${money(row.sales, lang)} | الخارج: ${money(row.expense, lang)} | النتيجة: ${money(row.net, lang)}`
          : `${businessName(row.business, lang)} | Sales: ${money(row.sales, lang)} | Outflow: ${money(row.expense, lang)} | Result: ${money(row.net, lang)}`),
        lang === "ar"
          ? `الإجمالي | المبيعات: ${money(record.sales, lang)} | الخارج: ${money(record.expense, lang)} | النتيجة: ${money(record.net, lang)}`
          : `Total | Sales: ${money(record.sales, lang)} | Outflow: ${money(record.expense, lang)} | Result: ${money(record.net, lang)}`,
      ].join(String.fromCharCode(10))
    : isOutflowReport
      ? [
          lang === "ar" ? "تقفيلة - تقرير الخارج" : "Taqfeelah - Outflow report",
          title,
          periodLabel,
          lang === "ar" ? `التصنيف: ${outflowCategoryLabel}` : `Category: ${outflowCategoryLabel}`,
          lang === "ar" ? `إجمالي الخارج: ${money(outflowTotal, lang)}` : `Total outflow: ${money(outflowTotal, lang)}`,
          lang === "ar" ? `عدد العمليات: ${filteredOutflowEntries.length}` : `Transactions: ${filteredOutflowEntries.length}`,
        ].join(String.fromCharCode(10))
      : isChannelsReport
        ? [
            lang === "ar" ? "تقفيلة - تقرير القنوات" : "Taqfeelah - Channels report",
            title,
            periodLabel,
            ...shareChannelRows.map((row) => `${row.label}: ${money(row.amount, lang)}`),
          ].join(String.fromCharCode(10))
        : isDaysReport
          ? [
              lang === "ar" ? "تقفيلة - تقرير الأيام" : "Taqfeelah - Days report",
              title,
              periodLabel,
              ...shareDayRows.map((row) => lang === "ar"
                ? `${formatCalendarDate(row.date, lang)} | المبيعات: ${money(row.sales, lang)} | الخارج: ${money(row.expense, lang)}`
                : `${formatCalendarDate(row.date, lang)} | Sales: ${money(row.sales, lang)} | Outflow: ${money(row.expense, lang)}`),
            ].join(String.fromCharCode(10))
          : isProofsReport
            ? [
                lang === "ar" ? "تقفيلة - تقرير المرفقات" : "Taqfeelah - Attachments report",
                title,
                periodLabel,
                lang === "ar" ? `إجمالي المرفقات: ${shareProofEntries.length}` : `Total attachments: ${shareProofEntries.length}`,
                lang === "ar" ? `لم تتم مراجعتها: ${sharePendingProofs}` : `Not reviewed: ${sharePendingProofs}`,
              ].join(String.fromCharCode(10))
            : [
                lang === "ar" ? `تقفيلة - ${title}` : `Taqfeelah - ${title}`,
                periodLabel,
                lang === "ar" ? `المبيعات: ${money(record.sales, lang)}` : `Sales: ${money(record.sales, lang)}`,
                lang === "ar" ? `الخارج: ${money(record.expense, lang)}` : `Outflow: ${money(record.expense, lang)}`,
                lang === "ar" ? `النتيجة: ${money(record.net, lang)}` : `Result: ${money(record.net, lang)}`,
              ].join(String.fromCharCode(10));
  const formats = [
    { id: "image", label: "imageFormat", icon: FileImage },
    { id: "pdf", label: "pdfFormat", icon: FileText },
    { id: "excel", label: "excelFormat", icon: FileSpreadsheet },
  ];

  const detailedSummary = snapshot.screen === "reports" && snapshot.tab === "summary" && snapshot.showSummaryDetails && !combined;
  const showHomeOperations = snapshot.screen === "home" && snapshot.showDetails && !combined && !monthly;
  const shareOperations = showHomeOperations ? newestEntries(scopedShareEntries.filter(entryIsActive)) : [];
  const showOutflowOperations = isOutflowReport && snapshot.showOutflowTransactions && !combined;
  const shareOutflowOperations = showOutflowOperations ? newestEntries(filteredOutflowEntries) : [];
  const shareChannels = snapshot.reportChannels || channels;
  const salesBase = record.sales || 0;
  const percentageOfSales = (amount) => salesBase > 0 ? `${((amount / salesBase) * 100).toFixed(1)}%` : amount > 0 ? "â€”" : "0.0%";
  const shareEntries = scopedShareEntries;
  const detailOutflow = outflowReportCategories.filter((item) => item.id !== "all").map((item) => ({ ...item, amount: shareEntries.filter((entry) => entryIsActive(entry) && entryIsOutflow(entry) && entryCategory(entry) === item.id).reduce((sum, entry) => sum + entry.amount, 0) })).filter((item) => item.amount > 0);
  const salesDetailRows = aggregateChannels(operationalEntries, snapshot.selectedBusiness, monthly ? "month" : "day", shareDate, snapshot.selectedMonth, shareChannels).map((channel) => {
    const amount = channel.amount;
    return {
      label: channelName(channel, lang),
      ratio: percentageOfSales(amount),
      value: money(amount, lang),
      tone: "text-[#112A46]",
    };
  });
  const outflowDetailRows = detailOutflow.map((item) => ({
    label: text(lang, item.label),
    ratio: percentageOfSales(item.amount),
    value: money(item.amount, lang),
    tone: "text-[#B44747]",
  }));
  const tableRows = [
    { label: text(lang, "sales"), value: money(record.sales, lang), tone: "text-[#112A46]", heading: true },
    ...(detailedSummary ? salesDetailRows : []),
    { label: text(lang, "purchasesExpenses"), value: money(record.expense, lang), tone: "text-[#B44747]", heading: true },
    ...(detailedSummary ? outflowDetailRows : []),
    { label: text(lang, "outflowRatio"), value: ratio, tone: "text-[#B44747]", heading: true },
    { label: text(lang, "result"), value: money(record.net, lang), tone: record.net < 0 ? "text-[#B44747]" : "text-[#257844]", heading: true },
  ];
  const exportTitle = snapshot.screen === "reports" ? text(lang, "reportNotebook") : monthly ? text(lang, "monthlySummary") : text(lang, "dailySummary");
  const valueHeader = lang === "ar" ? "القيمة" : "Value";
  const detailsHeader = lang === "ar" ? "التفاصيل" : "Details";
  const exportTable = combined
    ? {
        headers: [text(lang, "store"), text(lang, "sales"), text(lang, "purchasesExpenses"), text(lang, "result")],
        rows: [
          ...shareBusinessRows.map((row) => [businessName(row.business, lang), money(row.sales, lang), money(row.expense, lang), money(row.net, lang)]),
          [text(lang, "combinedTotal"), money(record.sales, lang), money(record.expense, lang), money(record.net, lang)],
        ],
      }
    : isOutflowReport
      ? {
          headers: [text(lang, "reportType"), valueHeader, detailsHeader],
          rows: [
            [text(lang, "totalOutflow"), money(outflowTotal, lang), ""],
            [text(lang, "numberTransactions"), String(filteredOutflowEntries.length), ""],
            [text(lang, "averageTransaction"), money(outflowAverage, lang), ""],
          ],
        }
      : isChannelsReport
        ? { headers: [text(lang, "channels"), valueHeader], rows: shareChannelRows.map((row) => [row.label, money(row.amount, lang)]) }
        : isDaysReport
          ? { headers: [text(lang, "day"), text(lang, "sales"), text(lang, "purchasesExpenses")], rows: shareDayRows.map((row) => [formatCalendarDate(row.date, lang), money(row.sales, lang), money(row.expense, lang)]) }
          : isProofsReport
            ? { headers: [text(lang, "reportType"), valueHeader], rows: [[text(lang, "totalAttachments"), String(shareProofEntries.length)], ...(snapshot.reviewEnabled !== false ? [[text(lang, "notReviewedItems"), String(sharePendingProofs)]] : [])] }
            : detailedSummary
              ? { headers: [text(lang, "reportType"), lang === "ar" ? "النسبة" : "Ratio", valueHeader], rows: tableRows.map((row) => [row.label, row.ratio || "", row.value]) }
              : { headers: [text(lang, "reportType"), valueHeader, detailsHeader], rows: tableRows.map((row) => [row.label, row.value, ""]) };
  if (showHomeOperations) {
    exportTable.rows.push([text(lang, "operations"), "", formatCalendarDate(shareDate, lang)]);
    shareOperations.forEach((item) => exportTable.rows.push([operationDisplayLabel(item, lang), money(signedEntryAmount(item), lang), `${opTime(item, lang)} آ· ${entryHasAttachment(item) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}`]));
  }
  if (showOutflowOperations) {
    exportTable.rows.push([text(lang, "operations"), "", periodLabel]);
    shareOutflowOperations.forEach((item) => exportTable.rows.push([operationDisplayLabel(item, lang), money(signedEntryAmount(item), lang), `${formatCalendarDate(item.date, lang)} آ· ${opTime(item, lang)} آ· ${entryHasAttachment(item) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}`]));
  }
  const safeExportName = `${lang === "ar" ? "تقفيلة" : "Taqfeelah"}-${snapshot.screen}-${shareDate}`;
  const imageFilename = `${safeExportName}.png`;
  const buildNotebookImageFile = async () => {
    const blob = await captureNotebookPreviewBlob(previewRef.current, activeTheme.paper || "#FFFDF7");
    return new File([blob], imageFilename, { type: "image/png" });
  };
  const resolveNotebookImageFile = async () => {
    if (cachedImageFileRef.current) return cachedImageFileRef.current;
    const file = await buildNotebookImageFile();
    cachedImageFileRef.current = file;
    return file;
  };
  const runImageAction = async (action) => {
    setImageError("");
    setShareHint("");
    setImageBusy(true);
    try {
      const file = await resolveNotebookImageFile();
      await action(file);
    } catch (error) {
      if (error?.name === "AbortError") return;
      setImageError(text(lang, "shareImageFailed"));
    } finally {
      setImageBusy(false);
    }
  };
  const downloadNotebookImage = () => runImageAction(async (file) => downloadBlobFile(file, imageFilename));
  const shareImageViaWhatsApp = () => {
    setImageError("");
    setShareHint("");
    setImageBusy(true);
    void (async () => {
      try {
        const file = await resolveNotebookImageFile();
        const result = await shareNotebookImageToWhatsApp(file, shareCaption, lang);
        if (result.method === "clipboard") setShareHint(text(lang, "shareImagePasteHint"));
        else if (result.method === "text-only") setShareHint(text(lang, "shareImageWhatsAppUnavailable"));
      } catch (error) {
        if (error?.name === "AbortError") return;
        setImageError(text(lang, "shareImageFailed"));
      } finally {
        setImageBusy(false);
      }
    })();
  };
  const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const exportExcel = () => {
    const rows = [exportTable.headers, ...exportTable.rows];
    const csvRows = rows.map((row) => row.map(csvCell).join(","));
    const csv = "ï»؟" + csvRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeExportName}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
  const escapeHtml = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const exportPdf = () => {
    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) return;
    const direction = lang === "ar" ? "rtl" : "ltr";
    const headerHtml = exportTable.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
    const rowsHtml = exportTable.rows.map((row) => `<tr>${exportTable.headers.map((_, index) => `<td>${escapeHtml(row[index] || "")}</td>`).join("")}</tr>`).join("");
    printWindow.document.write(`<!doctype html><html dir="${direction}"><head><meta charset="UTF-8"><title>${escapeHtml(safeExportName)}</title><style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#112A46;padding:42px;background:#fff}header{border-bottom:3px solid #C28A30;padding-bottom:18px;margin-bottom:24px}h1{font-size:26px;margin:0 0 10px;font-weight:800}p{margin:4px 0;color:#716753;font-size:13px}table{width:100%;border-collapse:collapse;margin-top:24px;font-size:14px}th{background:#112A46;color:#fff;text-align:${lang === "ar" ? "right" : "left"};padding:12px}td{padding:12px;border-bottom:1px solid #E6DFD1;font-weight:600}tr:last-child td{font-weight:800;border-top:2px solid #C28A30}footer{margin-top:30px;color:#827762;font-size:11px}@media print{body{padding:20px}}</style></head><body><header><h1>${escapeHtml(exportTitle)}</h1><p>${escapeHtml(periodLabel)}</p>${!combined ? `<p>${escapeHtml(title)}</p>` : ""}</header><table><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table><footer>${escapeHtml(text(lang, "operationalOnly"))}</footer><script>window.onload = () => { window.print(); };<\/script></body></html>`);
    printWindow.document.close();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 flex flex-col justify-end bg-[#112A46]/45 sm:items-center sm:justify-center sm:p-6 lg:items-stretch lg:justify-end lg:p-0">
      <div className="max-h-[92%] overflow-y-auto rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:w-full sm:max-w-[700px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-taq-meta font-bold text-[#827762]">{text(lang, "shareOptions")}</p>
            <h3 className="text-base font-black">{format === "image" ? text(lang, "notebookImagePreview") : text(lang, "professionalReportPreview")}</h3>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {formats.map((item) => {
            const Icon = item.icon;
            const active = format === item.id;
            return (
              <button type="button" key={item.id} onClick={() => setFormat(item.id)} className={`flex flex-col items-center gap-2 rounded-2xl px-2 py-3 text-taq-meta font-black transition ${active ? "bg-[#112A46] text-white" : "bg-white text-[#716753] ring-1 ring-black/[0.045]"}`}>
                <Icon className="h-5 w-5" />{text(lang, item.label)}
              </button>
            );
          })}
        </div>
        {format === "image" ? (
          <>
            <div ref={previewRef} className="mb-4 overflow-hidden rounded-[24px] p-0 shadow-lg" style={{ backgroundColor: activeTheme.paper }}>
              <div className="relative px-5 pb-4 pt-3" style={{ ...lines, fontFamily: lang === "ar" ? "'Noto Sans Arabic', sans-serif" : "'Noto Sans', sans-serif" }}>
                <div className={`absolute bottom-0 top-0 w-[1.25px] ${lang === "ar" ? "right-8" : "left-8"}`} style={{ backgroundColor: activeTheme.margin }} />
                <div className={lang === "ar" ? "pr-6 pl-1" : "pl-6 pr-1"}>
                  <div className="flex h-[54px] items-center justify-center">
                    <Logo compact centered />
                  </div>
                  <div className="flex h-[44px] items-end justify-center gap-3 pb-[8px] text-taq-meta font-black text-[#112A46]">
                    <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    <span>{periodLabel}</span>
                    <CalendarDays className="h-4 w-4 shrink-0" />
                  </div>
                  <div className="flex h-[58px] items-end justify-center pb-[8px]">
                    <div className="inline-flex flex-col items-center">
                      <p className="whitespace-nowrap text-taq-body font-black leading-none text-[#112A46]">{snapshot.screen === "reports" ? text(lang, "reportNotebook") : monthly ? text(lang, "monthlySummary") : text(lang, "dailySummary")}</p>
                      <span className="mt-2 block h-[2px] w-full rounded-full bg-[#C28A30]" />
                    </div>
                  </div>
                  {combined ? <>
                    <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[#806528]">{text(lang, "shopsComparisonReport")}</div>
                    <div className="grid h-[44px] grid-cols-[1.05fr_0.9fr_0.9fr_0.9fr] items-end gap-1 pb-2 text-taq-nav font-bold text-[#806528]"><span>{text(lang, "store")}</span><span className="text-center">{text(lang, "salesShort")}</span><span className="text-center">{text(lang, "outflowShort")}</span><span className="text-center">{text(lang, "result")}</span></div>
                    {shareBusinessRows.map((row) => <div key={row.business.id} className="grid h-[44px] grid-cols-[1.05fr_0.9fr_0.9fr_0.9fr] items-end gap-1 pb-2 text-taq-meta"><span className="truncate font-bold">{businessName(row.business, lang, true) || businessName(row.business, lang)}</span><strong className="text-center tabular-nums">{money(row.sales, lang)}</strong><strong className="text-center tabular-nums text-[#B44747]">{money(row.expense, lang)}</strong><strong className={`text-center tabular-nums ${row.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}>{money(row.net, lang)}</strong></div>)}
                    <div className="mt-1 grid h-[55px] grid-cols-[1.05fr_0.9fr_0.9fr_0.9fr] items-end gap-1 border-t-2 border-[#112A46]/55 pb-2 text-taq-meta"><span className="font-bold">{text(lang, "combinedTotal")}</span><strong className="text-center tabular-nums">{money(record.sales, lang)}</strong><strong className="text-center tabular-nums text-[#B44747]">{money(record.expense, lang)}</strong><strong className={`text-center tabular-nums ${record.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}>{money(record.net, lang)}</strong></div>
                  </> : isOutflowReport ? <>
                    <div className="flex min-h-[44px] items-end pb-2 text-taq-meta font-bold text-[#806528]">{text(lang, "detailedOutflowReport")} آ· {outflowCategoryLabel}</div>
                    <FinancialRows lang={lang} rows={[
                      { id: "share-total", label: text(lang, "totalOutflow"), value: money(outflowTotal, lang), valueClassName: "text-[#B44747]" },
                      { id: "share-count", label: text(lang, "numberTransactions"), value: `${filteredOutflowEntries.length}` },
                      { id: "share-average", label: text(lang, "averageTransaction"), value: money(outflowAverage, lang), valueClassName: "text-[#806528]" },
                    ]} />
                    {showOutflowOperations && (
                      <div className="pt-1">
                        <div className="flex h-[44px] items-end pb-[8px]">
                          <p className="inline-flex flex-col text-taq-meta font-black text-[#112A46]">
                            <span>{text(lang, "operations")}</span>
                            <span className="mt-1.5 h-[2px] w-full rounded-full bg-[#C28A30]" />
                          </p>
                        </div>
                        {shareOutflowOperations.length ? shareOutflowOperations.map((item, index) => (
                          <div key={`share-outflow-operation-${item.id}`} className={`grid min-h-[44px] w-full grid-cols-[max-content_minmax(0,1fr)] items-center gap-3 py-2 ${index < shareOutflowOperations.length - 1 ? "border-b border-[#D9DFE3]/70" : ""}`}>
                            <strong dir="ltr" className="min-w-[68px] whitespace-nowrap text-start tabular-nums text-taq-meta font-black text-[#B44747]">
                              <MoneyValue value={money(signedEntryAmount(item), lang)} />
                            </strong>
                            <span className="min-w-0 text-end">
                              <span className="block truncate text-taq-meta font-bold text-[#112A46]">{operationDisplayLabel(item, lang)}</span>
                              <small className="mt-0.5 block truncate text-taq-nav font-bold text-[#8A816F]">{formatCalendarDate(item.date, lang)} آ· {opTime(item, lang)} آ· {entryHasAttachment(item) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}</small>
                            </span>
                          </div>
                        )) : (
                          <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[#806528]">{text(lang, "noOutflowPeriod")}</div>
                        )}
                      </div>
                    )}
                  </> : isChannelsReport ? <>
                    <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[#806528]">{text(lang, "channelsReport")}</div>
                    {shareChannelRows.length ? shareChannelRows.map((row) => <div key={row.id} className="flex h-[44px] items-end justify-between pb-2 text-sm"><span>{row.label}</span><strong className="tabular-nums">{money(row.amount, lang)}</strong></div>) : <div className="flex h-[44px] items-end pb-2 text-xs text-[#806528]">{text(lang, "noSalesChannelsPeriod")}</div>}
                  </> : isDaysReport ? <>
                    <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[#806528]">{text(lang, "daysReport")}</div>
                    {shareDayRows.length ? <><div className="grid h-[44px] grid-cols-[1.25fr_1fr_1fr] items-end gap-1 pb-2 text-taq-nav font-bold text-[#806528]"><span>{text(lang, "day")}</span><span className="text-center">{text(lang, "salesShort")}</span><span className="text-center">{text(lang, "outflowShort")}</span></div>{shareDayRows.map((row) => <div key={row.date} className="grid h-[44px] grid-cols-[1.25fr_1fr_1fr] items-end gap-1 pb-2 text-taq-meta"><span className="truncate font-bold">{formatCalendarDate(row.date, lang)}</span><strong className="text-center tabular-nums">{money(row.sales, lang)}</strong><strong className="text-center tabular-nums text-[#B44747]">{money(row.expense, lang)}</strong></div>)}</> : <div className="flex h-[44px] items-end pb-2 text-xs text-[#806528]">{text(lang, "noCloseoutsPeriod")}</div>}
                  </> : isProofsReport ? <>
                    <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[#806528]">{text(lang, "attachmentsReport")}</div>
                    <div className="flex h-[44px] items-end justify-between pb-2 text-sm"><span>{text(lang, "totalAttachments")}</span><strong className="tabular-nums">{shareProofEntries.length}</strong></div>
                    {snapshot.reviewEnabled !== false && <div className="flex h-[44px] items-end justify-between pb-2 text-sm text-[#B96725]"><span>{text(lang, "notReviewedItems")}</span><strong className="tabular-nums">{sharePendingProofs}</strong></div>}
                    {snapshot.reviewEnabled === false && <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[#806528]">{text(lang, "reviewDisabled")}</div>}
                  </> : <>
                    <div className="flex h-[44px] items-end justify-between pb-2 text-sm"><span>{text(lang, "sales")}</span><strong className="tabular-nums"><MoneyValue value={money(record.sales, lang)} /></strong></div>
                    {detailedSummary && salesDetailRows.map((row) => (
                      <div key={`image-sales-${row.label}`} className="flex h-[44px] items-end justify-between pb-2 ps-3 text-xs">
                        <div className="flex items-center gap-2"><span className="text-[#716753]">{row.label}</span><RatioBadge value={row.ratio} /></div>
                        <strong className="tabular-nums text-[#112A46]"><MoneyValue value={row.value} /></strong>
                      </div>
                    ))}
                    <div className="flex h-[44px] items-end justify-between pb-2 text-sm text-[#B44747]"><span>{text(lang, "purchasesExpenses")}</span><strong className="tabular-nums"><MoneyValue value={money(record.expense, lang)} /></strong></div>
                    {detailedSummary && outflowDetailRows.map((row) => (
                      <div key={`image-outflow-${row.label}`} className="flex h-[44px] items-end justify-between pb-2 ps-3 text-xs">
                        <div className="flex items-center gap-2"><span className="text-[#716753]">{row.label}</span><RatioBadge value={row.ratio} /></div>
                        <strong className="tabular-nums text-[#B44747]"><MoneyValue value={row.value} /></strong>
                      </div>
                    ))}
                    <div className="flex h-[44px] items-end justify-between pb-2 text-xs text-[#806528]"><span>{text(lang, "outflowRatio")}</span><strong className="text-[#B44747]">{ratio}</strong></div>
                    <div className="mt-1 flex h-[55px] items-end justify-between border-t-2 border-[#112A46]/55 pb-2"><span className="text-sm font-bold">{snapshot.screen === "home" ? (monthly ? text(lang, "recordedMonthResult") : text(lang, "netMovement")) : text(lang, "result")}</span><strong className={`tabular-nums text-xl font-extrabold ${record.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}><MoneyValue value={money(record.net, lang)} /></strong></div>
                    {showHomeOperations && (
                      <div className="pt-1">
                        <div className="flex h-[44px] items-end pb-[8px]">
                          <p className="inline-flex flex-col text-taq-meta font-black text-[#112A46]">
                            <span>{text(lang, "operations")} {formatCalendarDate(shareDate, lang)}</span>
                            <span className="mt-1.5 h-[2px] w-full rounded-full bg-[#C28A30]" />
                          </p>
                        </div>
                        {shareOperations.length ? shareOperations.map((item, index) => {
                          const isSale = item.type === "summary";
                          return (
                            <div key={`share-operation-${item.id}`} className={`grid min-h-[44px] w-full grid-cols-[max-content_minmax(0,1fr)] items-center gap-3 py-2 ${index < shareOperations.length - 1 ? "border-b border-[#D9DFE3]/70" : ""}`}>
                              <strong dir="ltr" className={`min-w-[68px] whitespace-nowrap text-start tabular-nums text-taq-meta font-black ${isSale ? "text-[#257844]" : "text-[#B44747]"}`}>
                                <MoneyValue value={money(signedEntryAmount(item), lang)} />
                              </strong>
                              <span className="min-w-0 text-end">
                                <span className="block truncate text-taq-meta font-bold text-[#112A46]">{operationDisplayLabel(item, lang)}</span>
                                <small className="mt-0.5 block truncate text-taq-nav font-bold text-[#8A816F]">{opTime(item, lang)} آ· {entryHasAttachment(item) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}</small>
                              </span>
                            </div>
                          );
                        }) : (
                          <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[#806528]">{text(lang, "noEntriesDay")}</div>
                        )}
                      </div>
                    )}
                  </>}
                </div>
              </div>
            </div>
            <p className="mb-2 text-center text-taq-meta font-bold text-[#827762]">{text(lang, "imageReadyToShare")}</p>
            {shareHint && <p className="mb-3 rounded-xl bg-[#E6F5E9] px-3 py-2 text-center text-taq-meta font-bold text-[#257844]">{shareHint}</p>}
            {imageError && <p className="mb-3 rounded-xl bg-[#FFF1EE] px-3 py-2 text-center text-taq-meta font-bold text-[#B44747]">{imageError}</p>}
          </>
        ) : (
          <div className="mb-5 overflow-hidden rounded-[22px] bg-white ring-1 ring-black/[0.055]">
            <div className="bg-[#112A46] p-4 text-white">
              <div className="flex items-start justify-between gap-2"><div><p className="text-taq-meta font-medium text-white/65">{text(lang, "reportFor")}</p><h4 className="mt-1 text-sm font-extrabold">{title}</h4></div><span className={`rounded-lg px-2 py-1 text-taq-meta font-black ${format === "pdf" ? "bg-[#B44747]" : "bg-[#217346]"}`}>{format === "pdf" ? "PDF" : "Excel"}</span></div>
              <div className="mt-3 flex items-center justify-between text-taq-meta font-medium text-white/70"><span>{text(lang, "selectedPeriod")}</span><span>{periodLabel}</span></div>
            </div>
            <div className="p-3">
              <div className="grid rounded-t-lg bg-[#F4F2ED] px-3 py-2 text-taq-meta font-bold text-[#716753]" style={{ gridTemplateColumns: `repeat(${exportTable.headers.length}, minmax(0, 1fr))` }}>
                {exportTable.headers.map((header, index) => <span key={`export-head-${index}`} className={index > 0 ? "text-end" : ""}>{header}</span>)}
              </div>
              {exportTable.rows.map((row, index) => (
                <div key={`export-row-${index}`} className={`grid px-3 py-3 text-taq-meta ${index < exportTable.rows.length - 1 ? "border-b border-[#ECE6DA]" : ""} ${row[0] === text(lang, "operations") ? "bg-[#FFF4D2] font-black text-[#112A46]" : "font-bold"}`} style={{ gridTemplateColumns: `repeat(${exportTable.headers.length}, minmax(0, 1fr))` }}>
                  {exportTable.headers.map((_, cellIndex) => <span key={`export-cell-${index}-${cellIndex}`} className={`${cellIndex > 0 ? "text-end tabular-nums" : "text-[#112A46]"} truncate`}>{row[cellIndex] || ""}</span>)}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-[#ECE6DA] px-4 py-3 text-taq-meta font-bold text-[#827762]"><span>{text(lang, "appName")}</span><span>{text(lang, "preparedForExport")}</span></div>
          </div>
        )}
        {format === "image" ? (
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={onClose} className="rounded-2xl bg-white py-3.5 text-taq-meta font-black text-[#112A46] ring-1 ring-black/[0.06]">{lang === "ar" ? "إغلاق" : "Close"}</button>
            <button type="button" disabled={imageBusy} onClick={downloadNotebookImage} className="flex items-center justify-center gap-1.5 rounded-2xl bg-white py-3.5 text-taq-meta font-black text-[#112A46] ring-1 ring-black/[0.06] disabled:opacity-60">
              <Download className="h-3.5 w-3.5" />{text(lang, "downloadNotebookImage")}
            </button>
            <button type="button" disabled={imageBusy} onClick={shareImageViaWhatsApp} className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#25D366] py-3.5 text-taq-meta font-black text-white disabled:opacity-60">
              <Send className="h-3.5 w-3.5" />{imageBusy ? (lang === "ar" ? "جاري التجهيز…" : "Preparingâ€¦") : text(lang, "shareViaWhatsApp")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-[0.7fr_1.3fr] gap-3">
            <button onClick={onClose} className="rounded-2xl bg-white py-3.5 text-xs font-black text-[#112A46] ring-1 ring-black/[0.06]">{lang === "ar" ? "إغلاق" : "Close"}</button>
            {format === "pdf" && <button type="button" onClick={exportPdf} className="flex items-center justify-center gap-2 rounded-2xl bg-[#B44747] py-3.5 text-xs font-black text-white"><FileText className="h-4 w-4" />{text(lang, "exportPdf")}</button>}
            {format === "excel" && <button type="button" onClick={exportExcel} className="flex items-center justify-center gap-2 rounded-2xl bg-[#217346] py-3.5 text-xs font-black text-white"><FileSpreadsheet className="h-4 w-4" />{text(lang, "exportExcel")}</button>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function nextDayIso(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + 1);
  return isoCalendarDate(date.getFullYear(), date.getMonth(), date.getDate());
}

function OwnerHomeConnected(props) {
  const { pendingSubmittedCloseouts } = useDailyCloseouts();
  const storeIds = props.businessesList?.map((business) => business.id) || [];
  const pending = pendingSubmittedCloseouts(storeIds, props.closeoutReviewEnabledForBusiness);
  return (
    <OwnerHome
      {...props}
      pendingEmployeeCloseouts={pending}
      onViewPendingCloseouts={() => {
        const first = pending[0];
        if (first) props.onViewPendingCloseouts?.(first);
      }}
    />
  );
}

function OwnerRegisterConnected(props) {
  const { events, syncError } = useDailyCloseouts();
  return <OwnerRegisterScreen {...props} closeoutEvents={events} closeoutsSyncError={syncError} />;
}

function formatDateTimeLabel(iso, lang) {
  if (!iso) return "";
  const datePart = iso.slice(0, 10);
  const time = new Date(iso).toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" });
  return `${formatCalendarDate(datePart, lang)} آ· ${time}`;
}

function OwnerCloseoutModals({
  lang,
  ownerReviewCloseout,
  returnCloseoutTarget,
  ownerDisplayName,
  reviewWorkflowEnabled,
  ownerNotebookTheme = "yellow",
  resolveSalesChannels = () => [],
  channelLabel,
  onCloseoutUpdated = async () => {},
  onCloseoutDeleted = async () => {},
  onCloseReview,
  onRequestReturn,
}) {
  const { approveCloseout, returnCloseout, upsertCloseout, deleteCloseout } = useDailyCloseouts();
  const [editCloseout, setEditCloseout] = useState(null);

  if (editCloseout) {
    return (
      <DailyCloseoutEntryFlow
        lang={lang}
        notebookTheme={editCloseout.notebookTheme || ownerNotebookTheme}
        closeout={editCloseout}
        salesChannels={resolveSalesChannels(editCloseout.storeId)}
        storeName={editCloseout.storeName}
        isResubmit={false}
        saving={false}
        channelLabel={channelLabel}
        onCancel={() => setEditCloseout(null)}
        onSaveDraft={(draft) => setEditCloseout(draft)}
        onSubmit={async (nextCloseout) => {
          const updated = upsertCloseout(nextCloseout);
          await onCloseoutUpdated(updated);
          setEditCloseout(null);
          onCloseReview();
        }}
        findForStoreDate={() => null}
      />
    );
  }

  return (
    <>
      <OwnerCloseoutReviewPanel
        lang={lang}
        closeout={ownerReviewCloseout}
        formatCalendarDate={formatCalendarDate}
        formatDateTime={formatDateTimeLabel}
        reviewWorkflowEnabled={reviewWorkflowEnabled}
        onClose={onCloseReview}
        onApprove={async () => {
          if (!ownerReviewCloseout) return;
          const approved = await approveCloseout(ownerReviewCloseout.id, ownerDisplayName);
          if (!approved) {
            window.alert(lang === "ar" ? "تعذر اعتماد التقفيلة على الخادم." : "Failed to approve closeout on server.");
            return;
          }
          await onCloseoutUpdated(approved);
          onCloseReview();
        }}
        onReturn={() => {
          if (!ownerReviewCloseout) return;
          onRequestReturn(ownerReviewCloseout);
        }}
        onEdit={() => {
          if (!ownerReviewCloseout) return;
          setEditCloseout(ownerReviewCloseout);
        }}
        onDelete={async () => {
          if (!ownerReviewCloseout) return;
          const confirmed = window.confirm(lang === "ar" ? "هل تريد حذف هذه التقفيلة نهائيًا؟" : "Delete this closeout permanently?");
          if (!confirmed) return;
          deleteCloseout(ownerReviewCloseout.id);
          await onCloseoutDeleted(ownerReviewCloseout);
          onCloseReview();
        }}
      />
      <ReturnCloseoutModal
        lang={lang}
        open={Boolean(returnCloseoutTarget)}
        closeout={returnCloseoutTarget}
        onCancel={onCloseReview}
        onConfirm={async (reason) => {
          if (!returnCloseoutTarget) return;
          const returned = await returnCloseout(returnCloseoutTarget.id, ownerDisplayName, reason);
          if (!returned) {
            window.alert(lang === "ar" ? "تعذر إرجاع التقفيلة على الخادم." : "Failed to return closeout on server.");
            return;
          }
          await onCloseoutUpdated(returned);
          onCloseReview();
        }}
      />
    </>
  );
}

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
    ownerActor,
    channelNameFn: channelName,
  });

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
      const message = lang === "ar"
        ? "تعذر تحميل العمليات: لا يوجد محل مربوط بالخادم لهذا السياق."
        : "Failed to load operations: no store id is mapped for this API context.";
      setOperationalEntriesSyncError(message);
      throw new Error(message);
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
    const submitFailure = diagnoseCloseoutSubmitFailure({
      organizationId: closeoutsApiOrganizationId,
      actorUserId,
      closeout,
      storeChannels,
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
      actorRole: "employee",
      closeout,
      storeChannels,
      mode: action === "resubmit" ? "resubmit" : "submit",
      autoReview: !reviewWorkflowEnabled,
      requireReview: reviewWorkflowEnabled === true,
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
    const person = staff.find((item) => item.active && !item.removed) || PROTOTYPE_DEFAULT_STAFF[0];
    if (!person?.id) return;
    completeEmployeeLogin(person.id, person.apiUserId || "");
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
            onOwner={() => completeOwnerLogin()}
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
  return (
    <DailyCloseoutsProvider
      lang={lang}
      ownerName={ownerDisplayName}
      onSyncToOperationalEntries={syncCloseoutToOperationalEntries}
      onSubmitCloseoutToApi={syncSubmitCloseoutToApi}
      onReviewCloseoutInApi={syncReviewCloseoutToApi}
      loadCloseoutsFromApi={
        closeoutsApiEnabled && closeoutsApiOrganizationId && (!employee || employeeRuntimeReady)
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
            notebookMode={employee || (!employee && (ownerPage === "home" || ownerPage === "reports" || ownerPage === "register"))}
            notebookTheme={employee ? employeeNotebookTheme : notebookTheme}
            onLogout={logout}
            onEmployeeSettings={() => employeeSettingsOpenerRef.current?.()}
            onNotifications={openNotifications}
            showNotifications={ownerNotificationsVisible}
            hasNotificationBadge={ownerNotificationBadge}
          />
          <div className="taq-scroll relative min-h-0 overflow-y-auto overscroll-y-contain">{employee && !activeEmployee && <section className="px-5 pb-24"><div className="rounded-3xl bg-white p-8 text-center text-sm font-bold text-[#827762] ring-1 ring-black/[0.045]">{text(lang, "noActiveEmployee")}</div></section>}{employee && activeEmployee && employeePage === "closeouts" && <EmployeeCloseoutsView lang={lang} employee={activeEmployee} employeeRuntimeReady={employeeRuntimeReady} currentStore={currentEmployeeBusiness} assignedStores={assignedEmployeeBusinesses} onSelectStore={setEmployeeBusinessId} salesChannels={currentEmployeeChannelConfig.channels.filter((channel) => currentEmployeeChannelConfig.activeIds.includes(channel.id) && !channel.retired).map((channel) => ({ ...channel, displayName: channelName(channel, lang) }))} notebookTheme={employeeNotebookTheme} reviewWorkflowEnabled={closeoutReviewEnabledForBusiness(currentEmployeeBusiness?.id)} employeeHistoryVisibility={currentEmployeeOperationalConfig.employeeHistoryVisibility || "all"} formatCalendarDate={formatCalendarDate} channelLabel={(channel) => channel.displayName || channelName(channel, lang)} settingsPanel={({ onBack }) => <EmployeeSettingsScreen lang={lang} onBack={onBack} currentStore={currentEmployeeBusiness} assignedStores={assignedEmployeeBusinesses} onSelectStore={setEmployeeBusinessId} employeeNotebookTheme={employeeThemeOverride || readEmployeeNotebookTheme(activeEmployee.id) || employeeNotebookTheme} setEmployeeNotebookTheme={(theme) => { writeEmployeeNotebookTheme(activeEmployee.id, theme); setEmployeeThemeOverride(theme); }} onOpenSupport={() => openWhatsAppSupport(lang)} onOpenHelp={() => setHelpOpen(true)} />} onEntryActiveChange={setEmployeeEntryActive} onRegisterAdd={(handler) => { employeeAddHandlerRef.current = handler || (() => {}); }} onRegisterSettingsOpener={(handler) => { employeeSettingsOpenerRef.current = handler || (() => {}); }} saving={saving} />}{!employee && ownerPage === "home" && <NotebookScrollSurface theme={notebookTheme} lang={lang}><OwnerHomeConnected lang={lang} operationalEntries={operationalEntries} operationalEntriesLoading={operationalEntriesLoading} duplicateSalesAlerts={duplicateSalesAlerts} closeoutAlerts={unseenCloseoutAlerts} closeoutReviewEnabledForBusiness={closeoutReviewEnabledForBusiness} onViewPendingCloseouts={(closeout) => { setOwnerReviewCloseout(closeout); setSelectedBusiness(closeout.storeId); }} onReviewCloseout={reviewCloseoutAlert} onDismissCloseout={dismissCloseoutAlert} onReviewDuplicate={reviewDuplicateSales} onAcknowledgeDuplicate={acknowledgeDuplicateSales} reviewEnabledForBusiness={reviewEnabledForBusiness} onOpenOperation={handleOpenOwnerOperation} onShareNotebook={setShareSnapshot} notebookTheme={notebookTheme} selectedBusiness={activeViewBusiness} setSelectedBusiness={setSelectedBusiness} reviewEnabled={ownerReviewEnabled} businessesList={activeBusinesses} summaryApiEnabled={entriesApiEnabled} summaryApiOrganizationId={closeoutsApiOrganizationId} summaryApiActorUserId={ownerApiUserId} summaryApiActorRole="owner" summaryRefreshKey={summaryRefreshKey} /></NotebookScrollSurface>}{!employee && ownerPage === "add-summary" && <OwnerSummaryScreen lang={lang} saving={saving} selectedBusiness={activeViewBusiness} businessesList={activeBusinesses} storeChannelSettings={storeChannelSettings} onBack={() => setOwnerPage("home")} onSave={saveOwnerSummary} />}{!employee && ownerPage === "add-expense" && <OwnerExpenseScreen lang={lang} saving={saving} selectedBusiness={activeViewBusiness} businessesList={activeBusinesses} storeOperationalSettings={storeOperationalSettings} onBack={() => setOwnerPage("home")} onSave={saveOwner} />}{!employee && ownerPage === "reports" && <NotebookScrollSurface theme={notebookTheme} lang={lang}><ReportsScreen lang={lang} operationalEntries={operationalEntries} operationalEntriesLoading={operationalEntriesLoading} archivedReadOnlyBusinessId={archivedReadOnlyBusinessId} reviewEnabledForBusiness={reviewEnabledForBusiness} onShareNotebook={setShareSnapshot} notebookTheme={notebookTheme} setNotebookTheme={setNotebookTheme} selectedBusiness={selectedBusiness} setSelectedBusiness={setSelectedBusiness} configuredChannels={reportChannelConfig.channels} reviewEnabled={ownerReviewEnabled} businessesList={reportingBusinesses} archivedBusinessIds={archivedBusinessIds} reportsApiEnabled={entriesApiEnabled} reportsApiOrganizationId={closeoutsApiOrganizationId} reportsApiActorUserId={ownerApiUserId} reportsApiActorRole="owner" summaryRefreshKey={summaryRefreshKey} /></NotebookScrollSurface>}{!employee && ownerPage === "register" && <OwnerRegisterConnected lang={lang} onOpenOperation={handleOpenOwnerOperation} reviewFocus={duplicateReviewFocus} attachmentReviewRequest={attachmentReviewRequest} archivedReadOnlyBusinessId={archivedReadOnlyBusinessId} operationalEntries={operationalEntries} selectedBusiness={selectedBusiness} setSelectedBusiness={setSelectedBusiness} businessesList={reportingBusinesses} archivedBusinessIds={archivedBusinessIds} notebookTheme={notebookTheme} registerEntriesApiEnabled={entriesApiEnabled && REGISTER_ENTRIES_PAGINATION_ENABLED} registerEntriesApiOrganizationId={closeoutsApiOrganizationId} registerEntriesApiActorUserId={ownerApiUserId} registerEntriesApiActorRole="owner" registerEntriesRefreshKey={summaryRefreshKey} />}{!employee && ownerPage === "settings" && <OwnerSettingsScreen lang={lang} operationalEntries={operationalEntries} selectedBusiness={selectedBusiness} setSelectedBusiness={setSelectedBusiness} setOwnerPage={setOwnerPage} setArchivedReadOnlyBusinessId={setArchivedReadOnlyBusinessId} setLastCloseoutDates={setLastCloseoutDates} notebookTheme={notebookTheme} setNotebookTheme={setNotebookTheme} employeePreferences={employeePreferences} ownerShellPreferences={ownerShellPreferences} storeChannelSettings={storeChannelSettings} setStoreChannelSettings={setStoreChannelSettings} storeOperationalSettings={storeOperationalSettings} setStoreOperationalSettings={setStoreOperationalSettings} configuredBusinesses={configuredBusinesses} setConfiguredBusinesses={setConfiguredBusinesses} archivedBusinessIds={archivedBusinessIds} setArchivedBusinessIds={setArchivedBusinessIds} staff={staff} setStaff={setStaff} ownerProfile={ownerProfile} setOwnerProfile={setOwnerProfile} authOwnerUsername={authOwnerUsername} setAuthOwnerUsername={setAuthOwnerUsername} authOwnerPassword={authOwnerPassword} setAuthOwnerPassword={setAuthOwnerPassword} authEmployeePins={authEmployeePins} setAuthEmployeePins={setAuthEmployeePins} onPersistSettingsNow={persistRuntimeSettingsNow} onLogout={logout} onOpenSupport={() => openWhatsAppSupport(lang)} onOpenHelp={() => setHelpOpen(true)} />}{saved && <div className="sticky bottom-4 left-4 right-4 z-30 mx-auto max-w-md rounded-2xl bg-[#112A46] p-4 text-xs font-bold text-white">{text(lang, "savedNotice")}</div>}
          </div>
          {!(employee && employeeEntryActive) && <BottomNav lang={lang} employee={employee} active={employee ? employeePage : ownerPage} onAdd={() => { if (employee) employeeAddHandlerRef.current?.(); else setQuickAddOpen(true); }} onChange={(page) => { setQuickAddOpen(false); if (employee) changeEmployeePage(page); else changeOwnerPage(page); }} />}{!employee && <QuickAddSheet lang={lang} employee={false} open={quickAddOpen} onClose={() => setQuickAddOpen(false)} onSummary={openQuickAddSummary} onExpense={openQuickAddExpense} />}<OperationModal lang={lang} item={selected} onClose={() => setSelected(null)} onReview={confirmReview} onVoid={requestVoidOperation} onRestore={requestRestoreOperation} reviewEnabled={selectedOperationReviewEnabled} canVoid={Boolean(selected) && !archivedBusinessIds.includes(selected?.businessId)} canRestore={Boolean(selected) && !archivedBusinessIds.includes(selected?.businessId)} /><DuplicateSalesDialog lang={lang} draft={pendingDuplicateSummary?.payload || null} previousEntries={pendingDuplicateSummary?.previousEntries || []} businessesList={activeBusinesses} onCancel={() => setPendingDuplicateSummary(null)} onConfirm={confirmDuplicateSummary} /><VoidOperationDialog lang={lang} item={voidTarget} onCancel={() => setVoidTarget(null)} onConfirm={confirmVoidOperation} /><RestoreOperationDialog lang={lang} item={restoreTarget} onCancel={() => setRestoreTarget(null)} onConfirm={confirmRestoreOperation} /><SavedOutflowShareDialog lang={lang} item={savedOutflowShareTarget} businessesList={activeBusinesses} onClose={() => setSavedOutflowShareTarget(null)} /><NotebookShareModal lang={lang} snapshot={shareSnapshot} onClose={() => setShareSnapshot(null)} businessesList={reportingBusinesses} operationalEntries={operationalEntries} archivedBusinessIds={archivedBusinessIds} notebookExportApiEnabled={phase9ApiEnabled && entriesApiEnabled} notebookExportAuth={runtimeApiAuth} />
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

