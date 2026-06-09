"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, X } from "lucide-react";
import NotebookScrollSurface from "@/features/daily-closeouts/NotebookScrollSurface";
import { notebookCardBackground } from "@/features/daily-closeouts/notebook-themes";
import { useDailyCloseouts } from "@/features/daily-closeouts/DailyCloseoutsProvider";
import { employeeDisplayName } from "@/features/employee-closeouts/employee-entries-display";
import { formatCloseoutDayLabel } from "@/features/closeouts/client/closeout-day-label";
import {
  buildRegisterCloseoutDayContext,
  summaryEntryDisplayAmount,
} from "@/features/entries/client/register-operation-display";
import { useRegisterEntriesFromApi } from "@/features/entries/client/use-register-entries-from-api";
import { newestEntries } from "@/features/operations/operational-analytics";
import {
  DEFAULT_REGISTER_LOG_FILTERS,
  buildRegisterCloseoutSummaries,
  buildRegisterSalesChannelOptions,
  filterRegisterLogEntries,
  registerLogFilterCount,
  summarizeRegisterPeriod,
} from "@/features/entries/client/register-log-display";
import { formatCalendarDate, logPeriodScopeLabel } from "@/features/reports/client/report-period-labels";
import { ENTRIES_API_DB_SOURCE } from "./prototype-runtime-boot";
import {
  channels,
  businesses,
  businessName,
  businessLocation,
  channelName,
  expenseCategories,
  money,
  opTime,
  text,
} from "./prototype-runtime-demo-data";
import { prototypeOwnerActor } from "./prototype-runtime-demo-operational-entries";
import {
  entryCategory,
  entryDateMatches,
  entryHasAttachment,
  entryIsVoided,
  expandRegisterCloseoutOperationRows,
  operationDisplayLabel,
} from "./prototype-runtime-entry-helpers";
import {
  NotebookRow,
  MoneyValue,
  DateSelector,
  NotebookHeading,
  todayIsoDate,
} from "./prototype-runtime-notebook";
import { Badge, InkTab } from "./prototype-runtime-shell-ui";

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

export function OwnerRegisterScreen({ lang, onOpenOperation = () => {}, operationalEntries = [], selectedBusiness = "all", setSelectedBusiness = () => {}, businessesList = businesses, archivedBusinessIds = [], archivedReadOnlyBusinessId = null, reviewFocus = null, attachmentReviewRequest = null, notebookTheme = "yellow", registerEntriesApiEnabled = false, registerEntriesApiOrganizationId = "", registerEntriesApiActorUserId = "", registerEntriesApiActorRole = "owner", registerEntriesRefreshKey = 0, registerEntriesSyncError = "", closeoutsSyncError = "" }) {
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
        const ownerEntered = group.entries.find((entry) => entry.enteredBy?.userId === prototypeOwnerActor.userId) || group.entries[0];
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


export function OwnerRegisterConnected(props) {
  const { events, syncError } = useDailyCloseouts();
  return <OwnerRegisterScreen {...props} closeoutEvents={events} closeoutsSyncError={syncError} />;
}
