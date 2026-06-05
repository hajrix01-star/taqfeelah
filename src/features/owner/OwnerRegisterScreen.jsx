"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, FileText, Share2, X } from "lucide-react";
import { text } from "@/i18n/text";
import { money, businessName, formatCalendarDate, channelName, channels, expenseCategories, opTime, employeeName, todayIsoDate, fullDate, shortDate, businesses, emptyStoreRecord, outflowReportCategories } from "@/utils/display-helpers";
import { summarizeEntries, summaryMonthFromEntries, entriesInPeriod, aggregateChannels, entryIsActive, entryIsVoided, entryHasAttachment, duplicateSalesGroupKey, duplicateSalesSignature } from "@/features/operations/operational-analytics";
import { monthSelectionValue } from "@/features/operations/operational-analytics";
import { Badge, MoneyValue, NotebookRow, NumberLine, NotebookInk } from "@/features/daily-closeouts/NotebookAtoms";
import { CLOSEOUT_STATUS } from "@/features/daily-closeouts/closeout-status";
import { isProductionAppMode } from "@/core/config/app-mode";
import {
  DEFAULT_REGISTER_LOG_FILTERS,
  applyLedgerFilters,
  activeLedgerFilterCount,
  summarizeLedgerPeriod,
} from "@/features/owner/ledger/owner-ledger-filters";

const APP_IN_PRODUCTION_MODE = isProductionAppMode();


// ─── DateSelector ───────────────────────────────────
export function DateSelector({ lang, period, setPeriod, allowedPeriods = ["day", "month"], selectedDay, setSelectedDay, selectedDate = null, setSelectedDate = () => {}, fullCalendar = false, selectedMonth, setSelectedMonth, selectedYear = "2026", setSelectedYear = () => {}, customFrom = "2026-03-01", setCustomFrom = () => {}, customTo = "2026-05-31", setCustomTo = () => {}, compact = false }) {
  const [open, setOpen] = useState(false);
  const [calendarView, setCalendarView] = useState({ year: 2026, month: 4 });
  const [monthPickerYear, setMonthPickerYear] = useState(2026);
  const [draftCustomFrom, setDraftCustomFrom] = useState(customFrom);
  const [draftCustomTo, setDraftCustomTo] = useState(customTo);
  const selectorRef = useRef(null);
  useEffect(() => { if (!open) { setDraftCustomFrom(customFrom); setDraftCustomTo(customTo); } }, [open, customFrom, customTo]);
  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);
  const modes = allowedPeriods.map((id) => ({ id, label: id === "day" ? "day" : id === "month" ? "month" : id === "year" ? "year" : "custom" }));
  const activeDate = selectedDate || todayIsoDate();
  const selectedLabel = period === "day" ? formatCalendarDate(activeDate, lang) : period === "month" ? formatSelectedMonth(selectedMonth, lang) : period === "year" ? selectedYear : `${customFrom} — ${customTo}`;
  const promptKey = period === "day" ? "selectDay" : period === "month" ? "selectMonth" : period === "year" ? "selectYear" : "selectRange";
  const invalidCustomRange = period === "custom" && draftCustomFrom > draftCustomTo;
  const weekDays = lang === "ar" ? ["ح", "ن", "ث", "ر", "خ", "ج", "س"] : ["S", "M", "T", "W", "T", "F", "S"];
  const firstWeekday = new Date(calendarView.year, calendarView.month, 1).getDay();
  const numberOfDays = new Date(calendarView.year, calendarView.month + 1, 0).getDate();
  const calendarDates = Array.from({ length: firstWeekday }, (_, index) => ({ key: `blank-${index}` })).concat(Array.from({ length: numberOfDays }, (_, index) => ({ key: `${index + 1}`, day: index + 1, iso: isoCalendarDate(calendarView.year, calendarView.month, index + 1) })));
  const yearMonths = Array.from({ length: 12 }, (_, index) => ({ month: index, value: `${monthPickerYear}-${String(index + 1).padStart(2, "0")}`, label: formatCalendarMonth(monthPickerYear, index, lang).replace(String(monthPickerYear), "").trim() }));
  const previousMonth = () => setCalendarView((current) => current.month === 0 ? { year: current.year - 1, month: 11 } : { year: current.year, month: current.month - 1 });
  const nextMonth = () => setCalendarView((current) => current.month === 11 ? { year: current.year + 1, month: 0 } : { year: current.year, month: current.month + 1 });
  const openCalendar = () => {
    if (period === "day") {
      const selected = new Date(`${activeDate}T12:00:00`);
      setCalendarView({ year: selected.getFullYear(), month: selected.getMonth() });
    }
    if (period === "month") {
      setMonthPickerYear(monthSelectionParts(selectedMonth).year);
    }
    if (!open) { setDraftCustomFrom(customFrom); setDraftCustomTo(customTo); }
    setOpen(!open);
  };
  return (
    <div ref={selectorRef} className={`relative ${compact ? "text-center" : "text-start"}`}>
      {!compact && <p className="mb-1 text-taq-meta font-bold text-[#806528]">{text(lang, promptKey)}</p>}
      <button onClick={openCalendar} className={compact ? "flex items-center justify-center gap-3 pb-1 text-taq-meta font-black text-[#112A46]" : "flex max-w-[145px] items-center gap-1 pb-1 text-taq-meta font-black text-[#112A46]"}>
        {compact && <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
        <span className="truncate">{selectedLabel}</span>
        {compact ? <CalendarDays className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className={`absolute z-40 w-[270px] rounded-2xl bg-[#FFFDF7] p-3 shadow-xl ring-1 ring-[#D8CCA8] ${compact ? "left-1/2 top-10 -translate-x-1/2" : "end-0 top-12"}`}>
            <div className={`mb-3 grid gap-1 ${modes.length === 4 ? "grid-cols-4" : "grid-cols-2"}`}>
              {modes.map((mode) => <button key={mode.id} onClick={() => setPeriod(mode.id)} className={`rounded-lg py-2 text-taq-meta font-bold ${period === mode.id ? "bg-[#112A46] text-white" : "text-[#806528]"}`}>{text(lang, mode.label)}</button>)}
            </div>
            {period === "day" && <div>
              <div className="mb-3 flex items-center justify-between">
                <button onClick={previousMonth} title={text(lang, "previousMonth")} className="flex h-8 w-8 items-center justify-center rounded-xl text-[#806528] hover:bg-[#FFF0CB]"><ChevronRight className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} /></button>
                <strong className="text-taq-meta">{formatCalendarMonth(calendarView.year, calendarView.month, lang)}</strong>
                <button onClick={nextMonth} title={text(lang, "nextMonth")} className="flex h-8 w-8 items-center justify-center rounded-xl text-[#806528] hover:bg-[#FFF0CB]"><ChevronLeft className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} /></button>
              </div>
              <div className="mb-2 grid grid-cols-7 text-center text-taq-meta font-bold text-[#957D43]">{weekDays.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold">
                {calendarDates.map((date) => date.day ? <button key={date.key} onClick={() => { setSelectedDate(date.iso); setOpen(false); }} className={`relative flex h-8 items-center justify-center rounded-lg ${date.iso === activeDate ? "bg-[#B44747] text-white" : "text-[#112A46] hover:bg-[#FFF0CB]"}`}>{date.day}</button> : <span key={date.key} className="h-8" />)}
              </div>
            </div>}
            {period === "month" && <div>
              <div className="mb-3 flex items-center justify-between">
                <button onClick={() => setMonthPickerYear((year) => year - 1)} title={text(lang, "previousMonth")} className="flex h-8 w-8 items-center justify-center rounded-xl text-[#806528] hover:bg-[#FFF0CB]"><ChevronRight className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} /></button>
                <strong className="text-sm tabular-nums text-[#112A46]">{monthPickerYear}</strong>
                <button onClick={() => setMonthPickerYear((year) => year + 1)} title={text(lang, "nextMonth")} className="flex h-8 w-8 items-center justify-center rounded-xl text-[#806528] hover:bg-[#FFF0CB]"><ChevronLeft className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} /></button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {yearMonths.map((month) => <button key={month.value} onClick={() => { setSelectedMonth(month.value); setOpen(false); }} className={`rounded-xl px-1 py-2.5 text-taq-meta font-bold ${monthSelectionValue(selectedMonth) === month.value ? "bg-[#FFF0CB] text-[#B44747] ring-1 ring-[#B44747]/20" : "bg-white text-[#716753] ring-1 ring-black/[0.05]"}`}>{month.label}</button>)}
              </div>
            </div>}
            {period === "year" && <div className="grid grid-cols-2 gap-2">{["2026", "2025"].map((year) => <button key={year} onClick={() => { setSelectedYear(year); setOpen(false); }} className={`rounded-xl py-3 text-xs font-bold ${selectedYear === year ? "bg-[#FFF0CB] text-[#B44747] ring-1 ring-[#B44747]/20" : "bg-white text-[#716753] ring-1 ring-black/[0.05]"}`}>{year}</button>)}</div>}
            {period === "custom" && <div><div className="grid grid-cols-2 gap-2"><label className="rounded-xl bg-[#F7F5EF] p-2 text-taq-nav font-bold text-[#806528]">{text(lang, "fromDate")}<input dir="ltr" type="date" value={draftCustomFrom} onChange={(event) => setDraftCustomFrom(event.target.value)} className="mt-1 block w-full bg-transparent text-taq-meta font-bold text-[#112A46] outline-none" /></label><label className="rounded-xl bg-[#F7F5EF] p-2 text-taq-nav font-bold text-[#806528]">{text(lang, "toDate")}<input dir="ltr" type="date" value={draftCustomTo} onChange={(event) => setDraftCustomTo(event.target.value)} className="mt-1 block w-full bg-transparent text-taq-meta font-bold text-[#112A46] outline-none" /></label></div>{invalidCustomRange && <p className="mt-2 rounded-lg bg-[#FFF1EE] p-2 text-taq-nav font-bold text-[#B44747]">{text(lang, "invalidDateRange")}</p>}<button disabled={invalidCustomRange} onClick={() => { if (!invalidCustomRange) { setCustomFrom(draftCustomFrom); setCustomTo(draftCustomTo); setOpen(false); } }} className={`mt-3 w-full rounded-xl py-2.5 text-taq-meta font-bold text-white ${invalidCustomRange ? "bg-[#B8C0B7]" : "bg-[#112A46]"}`}>{text(lang, "applyPeriod")}</button></div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


// ─── StoreComparison ───────────────────────────────────
export function StoreComparison({ lang, monthly, reviewEnabled = false, businessesList = businesses, operationalEntries = [], selectedDate = "", selectedMonth = "" }) {
  const [showStores, setShowStores] = useState(false);
  const period = monthly ? "month" : "day";
  const total = useMemo(() => {
    if (operationalEntries.length > 0) {
      return summarizeEntries(
        operationalEntries.filter((entry) =>
          businessesList.some((business) => business.id === entry.businessId)
          && entryDateMatches(entry, period, selectedDate, selectedMonth, selectedDate.slice(0, 4) || "2026", "2026-01-01", "2026-12-31"),
        ),
        () => reviewEnabled,
      );
    }
    return businessesList.reduce(
      (acc, business) => {
        const record = (monthly ? business?.month : business?.day) || emptyStoreRecord;
        return { sales: acc.sales + record.sales, expense: acc.expense + record.expense, net: acc.net + record.net, pending: acc.pending + record.pending, proofs: acc.proofs + record.proofs };
      },
      { sales: 0, expense: 0, net: 0, pending: 0, proofs: 0, ratio: "0.0%" },
    );
  }, [businessesList, monthly, operationalEntries, period, reviewEnabled, selectedDate, selectedMonth]);
  if (businessesList.length > 2) {
    const ranked = [...businessesList].sort((a, b) => {
      const getNet = (bus) => summarizeEntries(
        entriesInPeriod(operationalEntries.filter((entry) => entry.businessId === bus.id), bus.id, period, selectedDate, selectedMonth),
      ).net;
      return getNet(b) - getNet(a);
    });
    return (
      <div>
        <NotebookRow><NumberLine label={text(lang, "sales")} value={money(total.sales, lang)} /></NotebookRow>
        <NotebookRow><NumberLine label={text(lang, "outflow")} value={money(total.expense, lang)} valueClassName="text-[#B44747]" /></NotebookRow>
        <NotebookRow strong lines={2}><NumberLine label={text(lang, "result")} value={money(total.net, lang)} valueClassName={total.net < 0 ? "text-[#B44747]" : "text-[#257844]"} /></NotebookRow>
        {reviewEnabled && <NotebookRow><NumberLine label={text(lang, "unreviewedShort")} value={`${total.pending}`} valueClassName="text-[#B96725]" /></NotebookRow>}
        <NotebookRow className="justify-center"><InkTab active={showStores} onClick={() => setShowStores(!showStores)} className="inline-flex items-center gap-1">{text(lang, showStores ? "hideStores" : "viewStores")}{showStores ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</InkTab></NotebookRow>
        {showStores && <div><NotebookRow><p className="text-taq-meta font-bold text-[#806528]">{text(lang, "storeResults")}</p></NotebookRow>{ranked.map((business) => { const record = businessRecord(business, monthly); return <NotebookRow key={business.id}><div className="flex w-full items-end justify-between text-xs"><span className="font-medium">{businessName(business, lang)}</span><strong className={`tabular-nums font-bold ${record.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}><MoneyValue value={money(record.net, lang)} /></strong></div></NotebookRow>; })}</div>}
      </div>
    );
  }
  return (
    <div>
      <NotebookRow><div className="grid w-full grid-cols-[1.05fr_1fr_1fr] gap-1 text-taq-meta font-bold text-[#806528]"><span className="text-taq-meta font-medium">{text(lang, "store")}</span>{businessesList.map((business) => <span key={business.id} className="text-center">{businessName(business, lang, true)}</span>)}</div></NotebookRow>
      <NotebookRow><div className="grid w-full grid-cols-[1.05fr_1fr_1fr] gap-1 text-xs font-medium"><span>{text(lang, "sales")}</span>{businessesList.map((business) => <span key={business.id} className="text-center font-bold tabular-nums"><MoneyValue value={money(summarizeEntries(entriesInPeriod(operationalEntries.filter((e)=>e.businessId===business.id),business.id,period,selectedDate,selectedMonth)).sales, lang)} /></span>)}</div></NotebookRow>
      <NotebookRow><div className="grid w-full grid-cols-[1.05fr_1fr_1fr] gap-1 text-xs font-medium"><span className="text-[#B44747]">{text(lang, "outflow")}</span>{businessesList.map((business) => <span key={business.id} className="text-center font-bold tabular-nums text-[#B44747]"><MoneyValue value={money(summarizeEntries(entriesInPeriod(operationalEntries.filter((e)=>e.businessId===business.id),business.id,period,selectedDate,selectedMonth)).expense, lang)} /></span>)}</div></NotebookRow>
      <NotebookRow><div className="grid w-full grid-cols-[1.05fr_1fr_1fr] gap-1 text-xs font-medium"><span>{text(lang, "result")}</span>{businessesList.map((business) => { const value = summarizeEntries(entriesInPeriod(operationalEntries.filter((e)=>e.businessId===business.id),business.id,period,selectedDate,selectedMonth)).net; return <span key={business.id} className={`text-center font-bold tabular-nums ${value < 0 ? "text-[#B44747]" : "text-[#257844]"}`}><MoneyValue value={money(value, lang)} /></span>; })}</div></NotebookRow>
      {reviewEnabled && <NotebookRow><div className="grid w-full grid-cols-[1.05fr_1fr_1fr] gap-1 text-taq-meta font-bold"><span className="font-medium text-[#806528]">{text(lang, "unreviewedShort")}</span>{businessesList.map((business) => <span key={business.id} className="text-center font-black text-[#B96725]">{summarizeEntries(entriesInPeriod(operationalEntries.filter((e)=>e.businessId===business.id),business.id,period,selectedDate,selectedMonth)).pending}</span>)}</div></NotebookRow>}
      <NotebookRow strong><NumberLine label={text(lang, "combinedTotal")} value={money(total.net, lang)} valueClassName={total.net < 0 ? "text-[#B44747]" : "text-[#257844]"} /></NotebookRow>
    </div>
  );
}


// ─── NotebookHeading ───────────────────────────────────
export function NotebookHeading({ lang, label = null, dateSelector = null, onShare = null }) {
  return (
    <div className="relative flex flex-col items-center pb-1 pt-2">
      {dateSelector && (
        <div className="flex h-[44px] w-full items-end justify-center pb-[8px]">
          {dateSelector}
        </div>
      )}
      {label && (
        <div className="flex h-[58px] items-end justify-center pb-[8px]">
          <div className="relative inline-flex flex-col items-center">
            <p className="whitespace-nowrap text-taq-body font-black leading-none text-[#112A46]">{label}</p>
            <span className="mt-2 block h-[2px] w-full rounded-full bg-[#C28A30]" />
            {onShare && (
              <button
                type="button"
                onClick={(event) => { event.preventDefault(); event.stopPropagation(); onShare(); }}
                title={text(lang, "shareNotebook")}
                aria-label={text(lang, "shareNotebook")}
                className={`absolute top-[-5px] z-20 flex h-[28px] w-[28px] items-center justify-center rounded-full text-[#112A46]/78 transition hover:bg-[#FFF0CB]/70 hover:text-[#9A823E] active:scale-95 ${lang === "ar" ? "-left-9" : "-right-9"}`}
              >
                <Share2 className="h-[16px] w-[16px]" strokeWidth={1.7} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── NotebookMarginTools ───────────────────────────────────
export function NotebookMarginTools({ lang, onShare }) {
  return (
    <div className="flex w-[29px] flex-col items-center pt-1">
      <button
        onClick={onShare}
        title={text(lang, "shareNotebook")}
        aria-label={text(lang, "shareNotebook")}
        className="flex h-[42px] w-[29px] items-center justify-center text-[#112A46]"
      >
        <Share2 className="h-[18px] w-[18px]" strokeWidth={2} />
      </button>
    </div>
  );
}


// ─── OwnerRegisterScreen ───────────────────────────────────
export default function OwnerRegisterScreen({ lang, onOpenOperation = () => {}, operationalEntries = [], selectedBusiness = "all", setSelectedBusiness = () => {}, businessesList = businesses, archivedBusinessIds = [], archivedReadOnlyBusinessId = null, reviewFocus = null, attachmentReviewRequest = null, notebookTheme = "yellow" }) {
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
  const periodEntries = operationalEntries.filter((entry) => (safeBusinessId === "all" ? activeBusinesses.some((business) => business.id === entry.businessId) : entry.businessId === safeBusinessId) && entryDateMatches(entry, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo));
  const actorOptions = useMemo(() => {
    const seen = new Set();
    const options = [{ id: "all", label: lang === "ar" ? "الكل" : "All" }];
    periodEntries.forEach((entry) => {
      const actorId = entry.enteredBy?.userId;
      if (!actorId || seen.has(actorId)) return;
      seen.add(actorId);
      options.push({
        id: actorId,
        label: employeeName(entry, lang) || (lang === "ar" ? "مستخدم" : "User"),
      });
    });
    return options;
  }, [periodEntries, lang]);
  const salesChannelOptions = useMemo(() => {
    const seen = new Set();
    const options = [{ id: "all", label: lang === "ar" ? "كل القنوات" : "All channels" }];
    periodEntries.forEach((entry) => {
      if (entry.type !== "summary") return;
      (entry.salesChannels || []).forEach((row) => {
        if (!row?.channelId || seen.has(row.channelId)) return;
        seen.add(row.channelId);
        const fallback = channels.find((channel) => channel.id === row.channelId);
        options.push({
          id: row.channelId,
          label: row.name || (fallback ? channelName(fallback, lang) : row.channelId),
        });
      });
    });
    return options;
  }, [periodEntries, lang]);
  // All filter logic delegated to owner-ledger-filters module — no inline predicates
  const filteredEntries = applyLedgerFilters(periodEntries, logFilters);
  const visibleEntries = newestEntries(filteredEntries);
  const closeoutSummaries = useMemo(() => {
    const grouped = new Map();
    newestEntries(filteredEntries).forEach((entry) => {
      // Keep each closeout independent by grouping on closeoutId when present.
      const key = entry.closeoutId
        ? `closeout|${entry.closeoutId}`
        : `legacy-day|${entry.businessId}|${entry.date}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          businessId: entry.businessId,
          closeoutId: entry.closeoutId || null,
          date: entry.date,
          entries: [],
        });
      }
      grouped.get(key).entries.push(entry);
    });
    return [...grouped.values()].map((group) => {
      const store = businessesList.find((business) => business.id === group.businessId) || null;
      const totals = summarizeEntries(group.entries);
      const salesChannels = aggregateSalesChannelsFromGroupEntries(group.entries, lang, logFilters.salesChannel);
      const channelSalesTotal = salesChannels.reduce((sum, row) => sum + row.amount, 0);
      const ownerEntered = group.entries.find((entry) => entry.enteredBy?.userId === ownerActor.userId) || group.entries[0];
      return {
        ...group,
        store,
        totals,
        salesChannels,
        displaySales: logFilters.salesChannel === "all" ? totals.sales : channelSalesTotal,
        operations: newestEntries(group.entries),
        actorLabel: employeeName(ownerEntered, lang) || text(lang, "enteredByOwner"),
      };
    }).filter((group) => logFilters.salesChannel === "all" || group.salesChannels.length > 0).sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      const aStamp = `${a.date}|${a.operations[0]?.createdAt || ""}`;
      const bStamp = `${b.date}|${b.operations[0]?.createdAt || ""}`;
      return bStamp.localeCompare(aStamp);
    });
  }, [filteredEntries, businessesList, lang, logFilters.salesChannel]);
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
  const activeFilterCount = activeLedgerFilterCount(logFilters);
  const registerCardStyle = useMemo(() => ({ backgroundColor: notebookCardBackground(notebookTheme) }), [notebookTheme]);
  const registerCardInsetStyle = useMemo(() => ({ backgroundColor: notebookCardBackground(notebookTheme, "inset") }), [notebookTheme]);
  const registerPeriodSummary = useMemo(
    () => summarizeLedgerPeriod(filteredEntries, logFilters.salesChannel, salesChannelOptions, lang),
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

        {logView === "operations" && (visibleEntries.length === 0 ? (
          <div className="rounded-2xl px-4 py-8 text-center text-taq-meta font-bold text-[#827762] ring-1 ring-[#E8E1D4]" style={registerCardStyle}>{text(lang, "noOperationsMatch")}</div>
        ) : (
          <div className="space-y-2.5">
            {visibleEntries.map((entry) => {
              const store = businessesList.find((business) => business.id === entry.businessId);
              const isSale = entry.type === "summary";
              const signedAmount = isSale ? entry.amount : -entry.amount;
              const isExpanded = expandedEntryId === entry.id;
              const actorLabel = employeeName(entry, lang) || (lang === "ar" ? "مستخدم" : "User");
              return (
                <article id={`register-entry-${entry.id}`} key={entry.id} className="overflow-hidden rounded-[19px] border border-[#E8E1D4] shadow-[0_8px_18px_rgba(17,42,70,0.06)]" style={registerCardStyle}>
                  <button type="button" onClick={() => setExpandedEntryId((current) => (current === entry.id ? null : entry.id))} className="flex w-full items-start gap-2.5 px-3.5 py-3 text-start">
                    <span className={`mt-0.5 h-8 w-1 shrink-0 rounded-full ${isSale ? "bg-[#39A160]" : "bg-[#E4B84A]"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-taq-meta font-black text-[#112A46]">{operationDisplayLabel(entry, lang)}</p>
                        {entryIsVoided(entry) && <Badge tone="warning">{text(lang, "voided")}</Badge>}
                        {entryHasAttachment(entry) && <Badge tone="navy">{text(lang, "attachmentExists")}</Badge>}
                      </div>
                      <p className="mt-1 truncate text-taq-nav font-bold text-[#827762]">{formatCalendarDate(entry.date, lang)} · {opTime(entry, lang)} · {businessName(store, lang, true) || businessName(store, lang)} · {actorLabel}</p>
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
          </div>
        ))}

        {logView === "closeouts" && (closeoutSummaries.length === 0 ? (
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
                        <p className="text-taq-meta font-black text-[#112A46]">{formatCalendarDate(summary.date, lang)}</p>
                        <p className="rounded-full border border-[#8EA1C4] px-2.5 py-1 text-taq-meta font-black text-[#214B7B]">{lang === "ar" ? `أدخلها ${summary.actorLabel}` : `Entered by ${summary.actorLabel}`}</p>
                      </div>
                      <p className="mt-1 text-taq-meta font-bold text-[#716753]">{lang === "ar" ? "تقفيلة يوم" : "Daily closeout"} · {storeLabel}</p>
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
                                {channel.name} · <span className="tabular-nums"><MoneyValue value={money(channel.amount, lang)} /></span>
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
                        {summary.operations.flatMap((item) => expandRegisterCloseoutOperationRows(item, lang).map((row) => (
                          <button key={row.key} type="button" onClick={() => onOpenOperation(row.item)} className="grid w-full grid-cols-[max-content_minmax(0,1fr)] items-center gap-3 rounded-xl px-2 py-2 text-start hover:bg-[#FFF4D2]/35">
                            <strong dir="ltr" className={`min-w-[70px] whitespace-nowrap text-start tabular-nums text-taq-meta font-black ${entryIsVoided(row.item) ? "text-[#A99D87] line-through" : row.isSale ? "text-[#257844]" : "text-[#B44747]"}`}>
                              <MoneyValue value={money(row.amount, lang)} />
                            </strong>
                            <span className="min-w-0 text-end">
                              <span className="truncate text-taq-meta font-bold text-[#112A46]">{row.label}</span>
                              <small className="mt-0.5 block truncate text-taq-nav font-bold text-[#8A816F]">{opTime(row.item, lang)} · {entryHasAttachment(row.item) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}</small>
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
