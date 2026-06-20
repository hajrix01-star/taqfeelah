"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import NotebookScrollSurface from "@/features/daily-closeouts/NotebookScrollSurface";
import { useDailyCloseouts } from "@/features/daily-closeouts/DailyCloseoutsProvider";
import { resolveCloseoutFromRegisterSummary } from "@/features/operations/client/register-closeout-summary-actions";
import { employeeDisplayName } from "@/features/employee-closeouts/employee-entries-display";
import {
  buildRegisterCloseoutDayContext,
} from "@/features/entries/client/register-operation-display";
import { useRegisterEntriesFromApi } from "@/features/entries/client/use-register-entries-from-api";
import { newestEntries } from "@/features/operations/operational-analytics";
import {
  DEFAULT_REGISTER_LOG_FILTERS,
  applyRegisterReportGranularity,
  buildRegisterCloseoutSummaries,
  buildRegisterDayReportRows,
  buildRegisterSalesChannelOptions,
  filterRegisterLogEntries,
  registerLogFilterCount,
  resolveRegisterCloseoutActorLabel,
  summarizeRegisterPeriod,
} from "@/features/entries/client/register-log-display";
import { buildRegisterAttachmentGalleryModel } from "@/features/entries/client/register-outflow-attachments";
import {
  logPeriodScopeLabel,
} from "@/features/reports/client/report-period-labels";
import {
  defaultRegisterReportGranularity,
  registerReportGranularityCountLabel,
  resolveRegisterReportGranularity,
  supportsRegisterReportGranularity,
  REGISTER_REPORT_GRANULARITY,
} from "@/features/reports/client/register-report-granularity";
import { useStoreReports } from "@/features/reports/client/use-store-reports";
import { entryIsActive, summarizeEntries } from "@/features/operations/operational-analytics";
import { resolveSalesChannelRowLabel } from "@/features/org-config/client/sales-channel-display";
import {
  channels,
  businesses,
  channelName,
  expenseCategories,
  text,
} from "./prototype-runtime-demo-data";
import { ENTRIES_API_DB_SOURCE } from "./prototype-runtime-boot";
import {
  entryCategory,
  entryDateMatches,
  operationDisplayLabel,
} from "./prototype-runtime-entry-helpers";
import {
  DateSelector,
  NotebookHeading,
  todayIsoDate,
} from "./prototype-runtime-notebook";
import { Badge } from "./prototype-runtime-shell-ui";
import AttachmentLightbox from "../AttachmentLightbox";
import { RegisterFiltersSheet } from "./owner-register-filters-sheet";
import { OwnerRegisterCloseoutsList } from "./owner-register-closeouts-list";
import { OwnerRegisterGeneralReportList } from "./owner-register-general-report-list";
import { OwnerRegisterOperationsList } from "./owner-register-operations-list";
import { OwnerRegisterAttachmentsGallery } from "./owner-register-attachments-gallery";
import { RegisterStoreChips } from "./owner-register-store-filter";
import { RegisterDashboardCard, OwnerRegisterReportGranularityToggle } from "./owner-register-ui-primitives";
import { confirmCloseoutDelete, alertCloseoutNotFound } from "@/lib/ui/app-dialog/app-dialog-helpers";

export function OwnerRegisterScreen({ lang, onOpenOperation = () => {}, onVoidOperation = () => {}, onRestoreOperation = () => {}, onEditCloseout = () => {}, onDeleteCloseout = () => {}, onShareRegister = () => {}, operationalEntries = [], selectedBusiness = "all", setSelectedBusiness = () => {}, businessesList = businesses, archivedBusinessIds = [], archivedReadOnlyBusinessId = null, duplicateSummaryFocus = null, notebookTheme = "yellow", registerEntriesApiEnabled = false, registerEntriesApiOrganizationId = "", registerEntriesApiActorUserId = "", registerEntriesApiActorRole = "owner", registerEntriesSyncError = "", closeoutsSyncError = "", entryAttachmentsApiEnabled = false, entryAttachmentsApiOrganizationId = "", entryAttachmentsApiActorUserId = "", entryAttachmentsApiActorRole = "owner" }) {
  const [period, setPeriod] = useState("month");
  const [selectedDate, setSelectedDate] = useState(() => todayIsoDate());
  const [selectedMonth, setSelectedMonth] = useState(() => todayIsoDate().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [customFrom, setCustomFrom] = useState(() => `${new Date().getFullYear()}-01-01`);
  const [customTo, setCustomTo] = useState(() => todayIsoDate());
  const [generalReportGranularity, setGeneralReportGranularity] = useState(
    () => defaultRegisterReportGranularity("month"),
  );
  const [logFilters, setLogFilters] = useState(DEFAULT_REGISTER_LOG_FILTERS);
  const [draftLogFilters, setDraftLogFilters] = useState(DEFAULT_REGISTER_LOG_FILTERS);
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const [logView, setLogView] = useState("report");
  const [expandedEntryId, setExpandedEntryId] = useState(null);
  const [expandedCloseoutKey, setExpandedCloseoutKey] = useState(null);
  const [registerAttachmentPreview, setRegisterAttachmentPreview] = useState(null);
  const openRegisterAttachmentPreview = (src, shareContext = null) => {
    setRegisterAttachmentPreview({ src, shareContext });
  };
  const closeRegisterAttachmentPreview = () => setRegisterAttachmentPreview(null);
  const entryAttachmentApiContext = {
    attachmentsApiEnabled: entryAttachmentsApiEnabled,
    organizationId: entryAttachmentsApiOrganizationId,
    actorUserId: entryAttachmentsApiActorUserId,
    actorRole: entryAttachmentsApiActorRole,
  };

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
    if (!duplicateSummaryFocus?.businessId || !duplicateSummaryFocus?.date || archivedReadOnlyBusinessId) return;
    setSelectedBusiness(duplicateSummaryFocus.businessId);
    setPeriod("day");
    setSelectedDate(duplicateSummaryFocus.date);
    setLogFilters({ ...DEFAULT_REGISTER_LOG_FILTERS, status: "active", type: "summary" });
  }, [duplicateSummaryFocus, archivedReadOnlyBusinessId, setSelectedBusiness]);

  const activeBusinesses = businessesList.filter((business) => !archivedBusinessIds.includes(business.id));
  const archivedReadOnlyBusiness = archivedReadOnlyBusinessId && archivedBusinessIds.includes(archivedReadOnlyBusinessId) ? businessesList.find((business) => business.id === archivedReadOnlyBusinessId) : null;
  const availableBusinesses = archivedReadOnlyBusiness ? [archivedReadOnlyBusiness] : activeBusinesses;
  const safeBusinessId = archivedReadOnlyBusiness ? archivedReadOnlyBusiness.id : activeBusinesses.length === 1 ? activeBusinesses[0].id : selectedBusiness === "all" || activeBusinesses.some((business) => business.id === selectedBusiness) ? selectedBusiness : "all";
  const showAllStores = safeBusinessId === "all";
  const changeRegisterPeriod = useCallback((nextPeriod) => {
    const today = todayIsoDate();
    setPeriod(nextPeriod);
    if (nextPeriod === "day") {
      setSelectedDate(today);
      setGeneralReportGranularity(REGISTER_REPORT_GRANULARITY.DAY);
      setLogView((current) => (current === "report" && safeBusinessId === "all" ? "closeouts" : current));
    } else if (nextPeriod === "month") {
      setSelectedMonth(today.slice(0, 7));
      setGeneralReportGranularity(REGISTER_REPORT_GRANULARITY.DAY);
    } else if (nextPeriod === "year") {
      setSelectedYear(String(new Date().getFullYear()));
      setGeneralReportGranularity(REGISTER_REPORT_GRANULARITY.MONTH);
    } else {
      setGeneralReportGranularity(REGISTER_REPORT_GRANULARITY.DAY);
    }
  }, [safeBusinessId]);
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
    loadingMore: registerEntriesLoadingMore,
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
  const attachmentsLoadMoreRef = useRef(null);
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
    if (!registerEntriesApiEnabled || logView !== "attachments" || !apiRegisterEntriesHasMore) return undefined;
    const target = attachmentsLoadMoreRef.current;
    if (!target) return undefined;
    const observer = new IntersectionObserver((records) => {
      if (records.some((record) => record.isIntersecting)) {
        loadMoreRegisterEntries();
      }
    }, { root: null, rootMargin: "320px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [apiRegisterEntriesHasMore, loadMoreRegisterEntries, logView, periodEntries.length, registerEntriesApiEnabled]);
  useEffect(() => {
    if (!registerEntriesApiEnabled || logView !== "closeouts" || !apiRegisterEntriesHasMore) return undefined;
    loadAllRegisterEntries();
    return undefined;
  }, [apiRegisterEntriesHasMore, loadAllRegisterEntries, logView, registerEntriesApiEnabled, safeBusinessId, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo]);
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
      (row) => resolveSalesChannelRowLabel(row, channels, lang, channelName),
      text(lang, "allPaymentMethods"),
      channels,
    ),
    [periodEntries, lang],
  );
  const filteredEntries = useMemo(
    () => filterRegisterLogEntries(periodEntries, logFilters, entryCategory, channels),
    [periodEntries, logFilters],
  );
  const attachmentGallery = useMemo(
    () => buildRegisterAttachmentGalleryModel(periodEntries, logFilters, {
      resolveLabel: (entry, labelLang) => operationDisplayLabel(entry, labelLang, logFilters.salesChannel),
      resolveExpenseCategory: entryCategory,
      configuredChannels: channels,
      todayIso: todayIsoDate(),
      lang,
    }),
    [lang, logFilters, periodEntries],
  );
  const attachmentGalleryEmptyMessage = logFilters.type === "summary"
    ? (lang === "ar" ? "تبويب المرفقات يعرض فواتير الخارج فقط." : "The attachments tab shows outflow invoices only.")
    : (lang === "ar" ? "لا توجد مرفقات خارج مطابقة للتصفية." : "No matching outflow attachments.");
  useEffect(() => {
    if (!registerEntriesApiEnabled || logView !== "attachments" || !apiRegisterEntriesHasMore) return undefined;
    if (attachmentGallery.count > 0) return undefined;
    loadMoreRegisterEntries();
    return undefined;
  }, [
    apiRegisterEntriesHasMore,
    attachmentGallery.count,
    loadMoreRegisterEntries,
    logView,
    periodEntries.length,
    registerEntriesApiEnabled,
  ]);
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
      configuredChannels: channels,
      resolveChannelName: (row) => resolveSalesChannelRowLabel(row, channels, lang, channelName),
      resolveStore: (businessId) => businessesList.find((business) => business.id === businessId) || null,
      resolveActorLabel: (group) => resolveRegisterCloseoutActorLabel(group, {
        ownerUserId: registerEntriesApiEnabled ? registerEntriesApiActorUserId : "",
        lang,
        enteredByOwnerLabel: text(lang, "enteredByOwner"),
      }),
    }),
    [filteredEntries, businessesList, lang, logFilters.salesChannel, registerEntriesApiActorUserId, registerEntriesApiEnabled],
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
  const registerPeriodSummary = useMemo(
    () => summarizeRegisterPeriod(
      filteredEntries,
      logFilters.salesChannel,
      salesChannelOptions,
      text(lang, "paymentMethods"),
      channels,
    ),
    [filteredEntries, lang, logFilters.salesChannel, salesChannelOptions],
  );
  const registerPeriodLabel = logPeriodScopeLabel(lang, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo);
  const resolvedGeneralReportGranularity = resolveRegisterReportGranularity(
    period,
    generalReportGranularity,
  );
  const showGeneralReportGranularityToggle = logView === "report"
    && supportsRegisterReportGranularity(period)
    && safeBusinessId !== "all";
  const generalReportNeedsStore = safeBusinessId === "all";
  const generalReportPeriodEntries = useMemo(
    () => periodEntries.filter(entryIsActive),
    [periodEntries],
  );
  const dailyGeneralReportRows = useMemo(
    () => buildRegisterDayReportRows(generalReportPeriodEntries),
    [generalReportPeriodEntries],
  );
  const localGeneralReportRows = useMemo(
    () => applyRegisterReportGranularity(dailyGeneralReportRows, resolvedGeneralReportGranularity),
    [dailyGeneralReportRows, resolvedGeneralReportGranularity],
  );
  const localGeneralReportTotals = useMemo(
    () => summarizeEntries(generalReportPeriodEntries),
    [generalReportPeriodEntries],
  );
  const generalReportApiEnabled = registerEntriesApiEnabled
    && !generalReportNeedsStore
    && logView === "report";
  const {
    daysRows: apiGeneralReportRows,
    singleStoreTotals: apiGeneralReportTotals,
    loading: generalReportApiLoading,
    loaded: generalReportApiLoaded,
    error: generalReportApiError,
  } = useStoreReports({
    enabled: generalReportApiEnabled,
    organizationId: registerEntriesApiOrganizationId,
    actorUserId: registerEntriesApiActorUserId,
    actorRole: registerEntriesApiActorRole,
    businesses: businessesList,
    selectedStoreId: safeBusinessId,
    period,
    selectedDate,
    selectedMonth,
    selectedYear,
    customFrom,
    customTo,
    configuredChannels: channels,
    includeOutflowTransactions: false,
  });
  const apiDailyGeneralReportRows = useMemo(
    () => (generalReportApiEnabled && generalReportApiLoaded && !generalReportApiError
      ? apiGeneralReportRows.map((row) => ({
        id: row.id || row.date,
        date: row.date || row.id,
        sales: row.sales,
        expense: row.expense,
        net: row.net,
      }))
      : []),
    [apiGeneralReportRows, generalReportApiEnabled, generalReportApiError, generalReportApiLoaded],
  );
  const generalReportRows = generalReportApiEnabled && generalReportApiLoaded && !generalReportApiError
    ? applyRegisterReportGranularity(apiDailyGeneralReportRows, resolvedGeneralReportGranularity)
    : localGeneralReportRows;
  const generalReportTotals = generalReportApiEnabled && generalReportApiLoaded && !generalReportApiError && apiGeneralReportTotals
    ? {
      sales: apiGeneralReportTotals.sales,
      expense: apiGeneralReportTotals.expense,
      net: apiGeneralReportTotals.net,
    }
    : {
      sales: localGeneralReportTotals.sales,
      expense: localGeneralReportTotals.expense,
      net: localGeneralReportTotals.net,
    };
  const generalReportDashboardSummary = useMemo(
    () => ({
      mode: "totals",
      sales: generalReportTotals.sales,
      expense: generalReportTotals.expense,
      net: generalReportTotals.net,
    }),
    [generalReportTotals.expense, generalReportTotals.net, generalReportTotals.sales],
  );
  const generalReportLoadError = generalReportApiEnabled && generalReportApiLoaded && generalReportApiError;
  const generalReportLoadErrorMessage = lang === "ar"
    ? "تعذر تحميل تقرير الأيام من الخادم. تم عرض البيانات المحلية المتاحة."
    : "Failed to load the days report from the server. Showing available local data.";
  const dashboardSummary = logView === "report" ? generalReportDashboardSummary : registerPeriodSummary;
  const dashboardShowFilters = logView !== "report";
  const openRegisterExport = () => onShareRegister({
    screen: "register",
    registerView: logView,
    theme: notebookTheme,
    period,
    selectedBusiness: safeBusinessId,
    includedBusinessIds: registerTargetStoreIds,
    selectedDate,
    selectedMonth,
    selectedYear,
    customFrom,
    customTo,
    generalReportGranularity: resolvedGeneralReportGranularity,
    exportData: {
      visibleEntries,
      closeoutSummaries,
      generalReportRows,
      generalReportGranularity: resolvedGeneralReportGranularity,
      periodEntries,
      attachmentGalleryItems: attachmentGallery.items,
    },
  });

  return (
    <NotebookScrollSurface theme={notebookTheme} lang={lang}>
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="taq-owner-page taq-notebook-body pb-28 pt-1">
        {archivedReadOnlyBusiness && <div className="mx-2 mb-2 flex justify-center"><Badge tone="warning">{text(lang, "archivedReadOnly")}</Badge></div>}
        <NotebookHeading
          lang={lang}
          label={text(lang, "operationsLog")}
          onShare={openRegisterExport}
          dateSelector={(
            <DateSelector
              compact
              lang={lang}
              period={period}
              setPeriod={changeRegisterPeriod}
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

        <div>
          <RegisterStoreChips
            lang={lang}
            businessesList={availableBusinesses}
            selectedBusiness={safeBusinessId}
            setSelectedBusiness={setSelectedBusiness}
            locked={Boolean(archivedReadOnlyBusiness)}
          />

          <RegisterDashboardCard
            lang={lang}
            logView={logView}
            setLogView={setLogView}
            tabCounts={{
              attachments: attachmentGallery.count,
              closeouts: closeoutSummaries.length,
              operations: visibleEntries.length,
              report: generalReportRows.length,
            }}
            activeFilterCount={activeFilterCount}
            onOpenFilters={openFiltersSheet}
            periodLabel={registerPeriodLabel}
            summary={dashboardSummary}
            showFilters={dashboardShowFilters}
          />
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

        <div className="mb-3 flex items-center justify-between">
          <span className="text-taq-meta font-black text-[#112A46]">{text(lang, "logResults")}</span>
          <span className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-black tabular-nums text-[#827762] ring-1 ring-[#E8E1D4]">
            {logView === "operations"
              ? `${visibleEntries.length} ${text(lang, "operations")}`
              : logView === "attachments"
                ? `${attachmentGallery.count} ${text(lang, "attachments")}`
              : logView === "report"
                ? registerReportGranularityCountLabel(
                  generalReportRows.length,
                  resolvedGeneralReportGranularity,
                  lang,
                )
                : `${closeoutSummaries.length} ${lang === "ar" ? "تقفيلات" : "Closeouts"}`}
          </span>
        </div>

        {logView === "attachments" && (
          <OwnerRegisterAttachmentsGallery
            lang={lang}
            sections={attachmentGallery.sections}
            businessesList={businessesList}
            showStoreBadge={showAllStores}
            entryAttachmentApiContext={entryAttachmentApiContext}
            daySequenceByCloseoutId={daySequenceByCloseoutId}
            sameDayCloseoutCountByStoreDate={sameDayCloseoutCountByStoreDate}
            onOpenOperation={onOpenOperation}
            onPreviewAttachment={openRegisterAttachmentPreview}
            registerEntriesApiEnabled={registerEntriesApiEnabled}
            apiRegisterEntriesHasMore={apiRegisterEntriesHasMore}
            registerLoadMoreRef={attachmentsLoadMoreRef}
            loadError={registerEntriesLoadError}
            loadErrorMessage={registerEntriesLoadErrorMessage}
            emptyMessage={attachmentGalleryEmptyMessage}
            loadingMore={registerEntriesLoadingMore}
          />
        )}

        {logView === "operations" && (
          <OwnerRegisterOperationsList
            lang={lang}
            businessesList={businessesList}
            visibleEntries={visibleEntries}
            logFilters={logFilters}
            daySequenceByCloseoutId={daySequenceByCloseoutId}
            sameDayCloseoutCountByStoreDate={sameDayCloseoutCountByStoreDate}
            showStoreBadge={showAllStores}
            entryAttachmentApiContext={entryAttachmentApiContext}
            expandedEntryId={expandedEntryId}
            setExpandedEntryId={setExpandedEntryId}
            onOpenOperation={onOpenOperation}
            onPreviewAttachment={openRegisterAttachmentPreview}
            registerEntriesApiEnabled={registerEntriesApiEnabled}
            apiRegisterEntriesHasMore={apiRegisterEntriesHasMore}
            registerLoadMoreRef={registerLoadMoreRef}
            loadError={registerEntriesLoadError}
            loadErrorMessage={registerEntriesLoadErrorMessage}
          />
        )}

        {logView === "closeouts" && (
          <OwnerRegisterCloseoutsList
            lang={lang}
            closeoutSummaries={closeoutSummaries}
            logFilters={logFilters}
            showStoreBadge={showAllStores}
            entryAttachmentApiContext={entryAttachmentApiContext}
            expandedCloseoutKey={expandedCloseoutKey}
            setExpandedCloseoutKey={setExpandedCloseoutKey}
            archivedBusinessIds={archivedBusinessIds}
            onOpenOperation={onOpenOperation}
            onVoidOperation={onVoidOperation}
            onRestoreOperation={onRestoreOperation}
            onEditCloseout={onEditCloseout}
            onDeleteCloseout={onDeleteCloseout}
            onPreviewAttachment={openRegisterAttachmentPreview}
            registerScrollId={registerScrollId}
            loadError={closeoutsLoadError}
            loadErrorMessage={closeoutsLoadErrorMessage}
          />
        )}

        {logView === "report" && showGeneralReportGranularityToggle && (
          <OwnerRegisterReportGranularityToggle
            lang={lang}
            value={resolvedGeneralReportGranularity}
            onChange={setGeneralReportGranularity}
          />
        )}

        {logView === "report" && (
          <OwnerRegisterGeneralReportList
            lang={lang}
            rows={generalReportRows}
            totals={generalReportTotals}
            granularity={resolvedGeneralReportGranularity}
            loading={generalReportApiEnabled && generalReportApiLoading && !generalReportApiLoaded && !dailyGeneralReportRows.length}
            loadError={generalReportLoadError && !dailyGeneralReportRows.length}
            loadErrorMessage={generalReportLoadErrorMessage}
            needsStoreSelection={generalReportNeedsStore}
          />
        )}
      </motion.section>
      <AttachmentLightbox
        open={Boolean(registerAttachmentPreview?.src)}
        src={registerAttachmentPreview?.src || ""}
        shareContext={registerAttachmentPreview?.shareContext || null}
        lang={lang}
        onClose={closeRegisterAttachmentPreview}
      />
    </NotebookScrollSurface>
  );
}


export function OwnerRegisterConnected({
  setOwnerEditCloseout = () => {},
  onCloseoutDeleted = async () => {},
  onVoidOperation = () => {},
  onRestoreOperation = () => {},
  lang = "ar",
  ...props
}) {
  const { events, syncError, closeouts, reloadCloseoutsFromApi, deleteCloseout } = useDailyCloseouts();

  const resolveSummaryCloseout = useCallback(async (summary) => {
    let closeout = resolveCloseoutFromRegisterSummary(summary, closeouts);
    if (!closeout && typeof reloadCloseoutsFromApi === "function") {
      try {
        const remoteCloseouts = await reloadCloseoutsFromApi();
        closeout = resolveCloseoutFromRegisterSummary(summary, remoteCloseouts);
      } catch {
        // fall through
      }
    }
    return closeout;
  }, [closeouts, reloadCloseoutsFromApi]);

  const handleEditCloseout = useCallback(async (summary) => {
    const closeout = await resolveSummaryCloseout(summary);
    if (!closeout) {
      await alertCloseoutNotFound(lang, text);
      return;
    }
    setOwnerEditCloseout(closeout);
  }, [lang, resolveSummaryCloseout, setOwnerEditCloseout]);

  const handleDeleteCloseout = useCallback(async (summary) => {
    const closeout = await resolveSummaryCloseout(summary);
    if (!closeout) {
      await alertCloseoutNotFound(lang, text);
      return;
    }
    if (!(await confirmCloseoutDelete(lang, text))) return;
    await deleteCloseout(closeout.id, closeout);
    await onCloseoutDeleted(closeout);
  }, [deleteCloseout, lang, onCloseoutDeleted, resolveSummaryCloseout]);

  return (
    <OwnerRegisterScreen
      {...props}
      lang={lang}
      closeoutEvents={events}
      closeoutsSyncError={syncError}
      onVoidOperation={onVoidOperation}
      onRestoreOperation={onRestoreOperation}
      onEditCloseout={handleEditCloseout}
      onDeleteCloseout={handleDeleteCloseout}
    />
  );
}