"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Share2 } from "lucide-react";
import { resolveAppFontFamily } from "@/core/fonts/app-font-family";
import { todayBusinessDateIso } from "@/core/date/business-date";
import {
  NOTEBOOK_THEME_IDS,
  notebookThemes,
} from "@/features/daily-closeouts/notebook-themes";
import { formatCalendarDate, formatCalendarMonth, formatSelectedMonth } from "@/features/reports/client/report-period-labels";
import { calendarViewFromIsoDate } from "./date-selector-calendar-view";
import {
  businessLocation,
  businessName,
  businessRecord,
  businesses,
  combinedTotals,
  money,
  text,
} from "./taqfeelah-app-catalog-data";
import { InkTab } from "./taqfeelah-app-shell-ui";
import type { ReactNode } from "react";
import type {
  NotebookThemeId,
  AppBusiness,
  AppLang,
} from "./taqfeelah-app-types";

function resolveNotebookTheme(theme: NotebookThemeId | string): NotebookThemeId {
  return (theme in notebookThemes ? theme : "yellow") as NotebookThemeId;
}

function Notebook({ children, theme = "yellow", lang = "ar", fullPage = false }: {
  children: ReactNode;
  theme?: NotebookThemeId | string;
  lang?: AppLang;
  fullPage?: boolean;
}) {
  const isArabic = lang === "ar";
  const themeKey = resolveNotebookTheme(theme);
  const activeTheme = notebookThemes[themeKey] || notebookThemes.yellow;
  const lines = {
    backgroundImage: `repeating-linear-gradient(180deg, transparent 0px, transparent 43px, ${activeTheme.line} 43px, ${activeTheme.line} 44px)`,
  };

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`relative overflow-hidden px-5 pb-0 pt-0 ${fullPage ? "" : `rounded-[28px] ${activeTheme.ring ? "ring-1 ring-[var(--taq-color-ded8cb)]" : ""}`}`}
      style={{
        backgroundColor: fullPage ? "transparent" : activeTheme.paper,
        boxShadow: fullPage ? "none" : activeTheme.shadow,
        fontFamily: resolveAppFontFamily(lang),
      }}
    >
      {!fullPage && <div className="pointer-events-none absolute inset-0 opacity-70" style={lines} />}
      <div className="relative">{children}</div>
    </div>
  );
}
function ThemePicker({ lang, theme, onChange, compact = false }: {
  lang: AppLang;
  theme: NotebookThemeId | string;
  onChange: (theme: NotebookThemeId) => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div
        role="listbox"
        aria-label={text(lang, "notebookAppearance")}
        className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {NOTEBOOK_THEME_IDS.map((id) => {
          const active = theme === id;
          const label = text(lang, id);
          return (
            <button
              key={id}
              type="button"
              role="option"
              aria-selected={active}
              aria-label={label}
              title={label}
              onClick={() => onChange(id)}
              className={`relative shrink-0 rounded-full border ${active ? "border-[var(--taq-color-112a46)] ring-2 ring-[var(--taq-color-112a46)]/15" : "border-[var(--taq-color-d9d1c1)]"}`}
            >
              <span
                className="block h-6 w-6 rounded-full"
                style={{ backgroundColor: notebookThemes[id].paper }}
              />
              {active && <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-[var(--taq-color-112a46)]" strokeWidth={3} />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
      {NOTEBOOK_THEME_IDS.map((id) => {
        const active = theme === id;
        return (
          <button key={id} type="button" onClick={() => onChange(id)} className="flex flex-col items-center gap-1.5" title={text(lang, id)}>
            <span className={`relative block h-7 w-7 rounded-full border ${active ? "border-[var(--taq-color-112a46)] ring-2 ring-[var(--taq-color-112a46)]/15" : "border-[var(--taq-color-d9d1c1)]"}`} style={{ backgroundColor: notebookThemes[id].paper }}>
              {active && <Check className="absolute inset-0 m-auto h-4 w-4 text-[var(--taq-color-112a46)]" strokeWidth={3} />}
            </span>
            <span className={`max-w-[50px] text-center text-taq-nav font-bold leading-3 ${active ? "text-[var(--taq-color-112a46)]" : "text-[var(--taq-color-827762)]"}`}>{text(lang, id)}</span>
          </button>
        );
      })}
    </div>
  );
}
function NotebookRow({ children, lines = 1, className = "", strong = false }: {
  children: ReactNode;
  lines?: number;
  className?: string;
  strong?: boolean;
}) {
  return (
    <div className={`flex w-full items-end pb-[8px] ${strong ? "border-t-2 border-[var(--taq-color-112a46)]/60" : ""} ${className}`} style={{ height: `${lines * 44}px` }}>
      {children}
    </div>
  );
}
function NotebookInk({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={className}>{children}</span>;
}
function MoneyValue({ value }: { value: ReactNode }) {
  const parts = typeof value === "string" ? value.match(/^(.*?)[ ]+(ر[.]س|SAR)$/) : null;
  if (!parts) return <>{value}</>;
  return (
    <span className="inline-flex items-baseline whitespace-nowrap">
      <span>{parts[1]}</span>
      <span className="ms-1 text-[0.58em] font-bold opacity-70">{parts[2]}</span>
    </span>
  );
}
function NumberLine({ label, value, valueClassName = "text-[var(--taq-color-112a46)]" }: {
  label: ReactNode;
  value: ReactNode;
  valueClassName?: string;
}) {
  return <div className="flex w-full items-end justify-between"><span className="text-taq-body-sm font-medium">{label}</span><strong className={`tabular-nums text-taq-body font-bold ${valueClassName}`}><MoneyValue value={value} /></strong></div>;
}

function FinancialRows({ lang, rows = [] }: {
  lang: AppLang;
  rows?: Array<{ id?: string; label: ReactNode; value: ReactNode; valueClassName?: string }>;
}) {
  return (
    <div className="grid w-full grid-cols-[minmax(0,1fr)_max-content] items-baseline">
      {rows.map((row) => (
        <React.Fragment key={String(row.id || row.label)}>
          <div className="flex h-[44px] min-w-0 items-end pb-[8px] text-taq-body-sm font-medium text-[var(--taq-color-112a46)]">
            <span className="truncate">{row.label}</span>
          </div>
          <strong
            dir="ltr"
            className={`flex h-[44px] min-w-[76px] items-end whitespace-nowrap pb-[8px] tabular-nums text-taq-body font-bold ${lang === "ar" ? "justify-start ps-4" : "justify-end pe-4"} ${row.valueClassName || "text-[var(--taq-color-112a46)]"}`}
          >
            <MoneyValue value={row.value} />
          </strong>
        </React.Fragment>
      ))}
    </div>
  );
}

function isoCalendarDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function todayIsoDate() {
  return todayBusinessDateIso();
}
function currentMonthIso() {
  return todayIsoDate().slice(0, 7);
}
function currentYearValue() {
  return todayIsoDate().slice(0, 4);
}
function monthStartIso(monthValue: string) {
  return `${monthSelectionValue(monthValue)}-01`;
}
function monthSelectionValue(value: string) {
  return /^[0-9]{4}-[0-9]{2}$/.test(value || "") ? value : currentMonthIso();
}
function monthSelectionParts(value: string) {
  const normalized = monthSelectionValue(value);
  const [year, month] = normalized.split("-").map(Number);
  return { year, month: month - 1, normalized };
}
function DateSelector({
  lang,
  period,
  setPeriod,
  allowedPeriods = ["day", "month"],
  selectedDay: _selectedDay,
  setSelectedDay: _setSelectedDay,
  selectedDate = null,
  setSelectedDate = () => {},
  fullCalendar: _fullCalendar = false,
  selectedMonth,
  setSelectedMonth,
  selectedYear = currentYearValue(),
  setSelectedYear = () => {},
  customFrom = monthStartIso(selectedMonth),
  setCustomFrom = () => {},
  customTo = todayIsoDate(),
  setCustomTo = () => {},
  compact = false,
  maxDate = "",
  initialOpen = false,
}: {
  lang: AppLang;
  period: string;
  setPeriod: (value: string) => void;
  allowedPeriods?: string[];
  selectedDay?: string;
  setSelectedDay?: (value: string) => void;
  selectedDate?: string | null;
  setSelectedDate?: (value: string) => void;
  fullCalendar?: boolean;
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
  selectedYear?: string;
  setSelectedYear?: (value: string) => void;
  customFrom?: string;
  setCustomFrom?: (value: string) => void;
  customTo?: string;
  setCustomTo?: (value: string) => void;
  compact?: boolean;
  maxDate?: string;
  initialOpen?: boolean;
}) {
  const activeDate = selectedDate || todayIsoDate();
  const [open, setOpen] = useState(initialOpen);
  const [calendarView, setCalendarView] = useState(() => calendarViewFromIsoDate(activeDate));
  const [monthPickerYear, setMonthPickerYear] = useState(() => monthSelectionParts(selectedMonth).year);
  const [draftCustomFrom, setDraftCustomFrom] = useState(customFrom);
  const [draftCustomTo, setDraftCustomTo] = useState(customTo);
  const selectorRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { if (!open) { setDraftCustomFrom(customFrom); setDraftCustomTo(customTo); } }, [open, customFrom, customTo]);
  useEffect(() => {
    if (!open) return;
    if (period === "day") {
      setCalendarView(calendarViewFromIsoDate(activeDate));
    }
    if (period === "month") {
      setMonthPickerYear(monthSelectionParts(selectedMonth).year);
    }
  }, [activeDate, open, period, selectedMonth]);
  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutside = (event: PointerEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
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
  const showPeriodModes = modes.length > 1;
  const maxSelectableDate = maxDate || "";
  const selectedLabel = period === "day"
    ? formatCalendarDate(activeDate, lang)
    : period === "month"
      ? formatSelectedMonth(selectedMonth, lang)
      : period === "year"
        ? selectedYear
        : `${formatCalendarDate(customFrom, lang)} — ${formatCalendarDate(customTo, lang)}`;
  const promptKey = period === "day" ? "selectDay" : period === "month" ? "selectMonth" : period === "year" ? "selectYear" : "selectRange";
  const invalidCustomRange = period === "custom" && draftCustomFrom > draftCustomTo;
  const weekDays = lang === "ar" ? ["ح", "ن", "ث", "ر", "خ", "ج", "س"] : ["S", "M", "T", "W", "T", "F", "S"];
  const firstWeekday = new Date(calendarView.year, calendarView.month, 1).getDay();
  const numberOfDays = new Date(calendarView.year, calendarView.month + 1, 0).getDate();
  const calendarDates: Array<{ key: string; day?: number; iso?: string }> = Array.from({ length: firstWeekday }, (_, index) => ({ key: `blank-${index}` })).concat(Array.from({ length: numberOfDays }, (_, index) => ({ key: `${index + 1}`, day: index + 1, iso: isoCalendarDate(calendarView.year, calendarView.month, index + 1) })));
  const yearMonths = Array.from({ length: 12 }, (_, index) => ({
    month: index,
    value: `${monthPickerYear}-${String(index + 1).padStart(2, "0")}`,
    label: String(index + 1).padStart(2, "0"),
  }));
  const selectedYearNumber = Number(selectedYear);
  const currentYearNumber = Number(currentYearValue());
  const baseYear = Number.isFinite(selectedYearNumber) ? selectedYearNumber : currentYearNumber;
  const yearOptions = Array.from(new Set([baseYear, currentYearNumber, currentYearNumber - 1, currentYearNumber + 1]))
    .filter((year) => Number.isFinite(year))
    .sort((a, b) => b - a)
    .map(String);
  const previousMonth = () => setCalendarView((current) => current.month === 0 ? { year: current.year - 1, month: 11 } : { year: current.year, month: current.month - 1 });
  const nextMonth = () => setCalendarView((current) => current.month === 11 ? { year: current.year + 1, month: 0 } : { year: current.year, month: current.month + 1 });
  const handleSelectPeriod = (modeId: string) => {
    setPeriod(modeId);
    if (modeId === "day") {
      setCalendarView(calendarViewFromIsoDate(activeDate));
    }
    if (modeId === "month") {
      setMonthPickerYear(monthSelectionParts(selectedMonth).year);
    }
  };
  const openCalendar = () => {
    if (!open) {
      setDraftCustomFrom(customFrom);
      setDraftCustomTo(customTo);
      if (period === "day") {
        setCalendarView(calendarViewFromIsoDate(activeDate));
      }
      if (period === "month") {
        setMonthPickerYear(monthSelectionParts(selectedMonth).year);
      }
    }
    setOpen(!open);
  };
  return (
    <div ref={selectorRef} className={`relative ${compact ? "text-center" : "text-start"}`}>
      {!compact && <p className="mb-1 text-taq-meta font-bold text-[var(--taq-color-806528)]">{text(lang, promptKey)}</p>}
      <button onClick={openCalendar} className={compact ? "flex items-center justify-center gap-3 pb-1 text-taq-meta font-black text-[var(--taq-color-112a46)]" : "flex max-w-[145px] items-center gap-1 pb-1 text-taq-meta font-black text-[var(--taq-color-112a46)]"}>
        {compact && <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
        <span className="truncate">{selectedLabel}</span>
        {compact ? <CalendarDays className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className={`absolute z-40 w-[270px] rounded-2xl bg-[var(--taq-color-fffdf7)] p-3 shadow-xl ring-1 ring-[var(--taq-color-d8cca8)] ${compact ? "left-1/2 top-10 -translate-x-1/2" : "end-0 top-12"}`}>
            {showPeriodModes ? (
              <div className={`mb-3 grid gap-1 ${modes.length === 4 ? "grid-cols-4" : "grid-cols-2"}`}>
                {modes.map((mode) => <button key={mode.id} type="button" onClick={() => handleSelectPeriod(mode.id)} className={`rounded-lg py-2 text-taq-meta font-bold ${period === mode.id ? "bg-[var(--taq-color-112a46)] text-white" : "text-[var(--taq-color-806528)]"}`}>{text(lang, mode.label)}</button>)}
              </div>
            ) : null}
            {period === "day" && <div>
              <div className="mb-3 flex items-center justify-between">
                <button onClick={previousMonth} title={text(lang, "previousMonth")} className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--taq-color-806528)] hover:bg-[var(--taq-color-fff0cb)]"><ChevronRight className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} /></button>
                <strong className="text-taq-meta">{formatCalendarMonth(calendarView.year, calendarView.month, lang)}</strong>
                <button onClick={nextMonth} title={text(lang, "nextMonth")} className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--taq-color-806528)] hover:bg-[var(--taq-color-fff0cb)]"><ChevronLeft className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} /></button>
              </div>
              <div className="mb-2 grid grid-cols-7 text-center text-taq-meta font-bold text-[var(--taq-color-957d43)]">{weekDays.map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold">
                {calendarDates.map((date) => {
                  if (!date.day) return <span key={date.key} className="h-8" />;
                  const isFuture = Boolean(maxSelectableDate && date.iso && date.iso > maxSelectableDate);
                  return (
                    <button
                      key={date.key}
                      type="button"
                      disabled={isFuture}
                      onClick={() => { if (!isFuture && date.iso) { setSelectedDate(date.iso); setOpen(false); } }}
                      className={`relative flex h-8 items-center justify-center rounded-lg ${date.iso === activeDate ? "bg-[var(--taq-color-b44747)] text-white" : isFuture ? "cursor-not-allowed text-[var(--taq-color-c8bca4)]" : "text-[var(--taq-color-112a46)] hover:bg-[var(--taq-color-fff0cb)]"}`}
                    >
                      {date.day}
                    </button>
                  );
                })}
              </div>
            </div>}
            {period === "month" && <div>
              <div className="mb-3 flex items-center justify-between">
                <button onClick={() => setMonthPickerYear((year) => year - 1)} title={text(lang, "previousMonth")} className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--taq-color-806528)] hover:bg-[var(--taq-color-fff0cb)]"><ChevronRight className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} /></button>
                <strong className="text-sm tabular-nums text-[var(--taq-color-112a46)]">{monthPickerYear}</strong>
                <button onClick={() => setMonthPickerYear((year) => year + 1)} title={text(lang, "nextMonth")} className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--taq-color-806528)] hover:bg-[var(--taq-color-fff0cb)]"><ChevronLeft className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} /></button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {yearMonths.map((month) => <button key={month.value} onClick={() => { setSelectedMonth(month.value); setOpen(false); }} className={`rounded-xl px-1 py-2.5 text-taq-meta font-bold ${monthSelectionValue(selectedMonth) === month.value ? "bg-[var(--taq-color-fff0cb)] text-[var(--taq-color-b44747)] ring-1 ring-[var(--taq-color-b44747)]/20" : "bg-white text-[var(--taq-color-716753)] ring-1 ring-black/[0.05]"}`}>{month.label}</button>)}
              </div>
            </div>}
            {period === "year" && <div className="grid grid-cols-2 gap-2">{yearOptions.map((year) => <button key={year} onClick={() => { setSelectedYear(year); setOpen(false); }} className={`rounded-xl py-3 text-xs font-bold ${selectedYear === year ? "bg-[var(--taq-color-fff0cb)] text-[var(--taq-color-b44747)] ring-1 ring-[var(--taq-color-b44747)]/20" : "bg-white text-[var(--taq-color-716753)] ring-1 ring-black/[0.05]"}`}>{year}</button>)}</div>}
            {period === "custom" && <div><div className="grid grid-cols-2 gap-2"><label className="rounded-xl bg-[var(--taq-color-f7f5ef)] p-2 text-taq-nav font-bold text-[var(--taq-color-806528)]">{text(lang, "fromDate")}<input dir="ltr" type="date" value={draftCustomFrom} onChange={(event) => setDraftCustomFrom(event.target.value)} className="mt-1 block w-full bg-transparent text-taq-meta font-bold text-[var(--taq-color-112a46)] outline-none" /></label><label className="rounded-xl bg-[var(--taq-color-f7f5ef)] p-2 text-taq-nav font-bold text-[var(--taq-color-806528)]">{text(lang, "toDate")}<input dir="ltr" type="date" value={draftCustomTo} onChange={(event) => setDraftCustomTo(event.target.value)} className="mt-1 block w-full bg-transparent text-taq-meta font-bold text-[var(--taq-color-112a46)] outline-none" /></label></div>{invalidCustomRange && <p className="mt-2 rounded-lg bg-[var(--taq-color-fff1ee)] p-2 text-taq-nav font-bold text-[var(--taq-color-b44747)]">{text(lang, "invalidDateRange")}</p>}<button disabled={invalidCustomRange} onClick={() => { if (!invalidCustomRange) { setCustomFrom(draftCustomFrom); setCustomTo(draftCustomTo); setOpen(false); } }} className={`mt-3 w-full rounded-xl py-2.5 text-taq-meta font-bold text-white ${invalidCustomRange ? "bg-[var(--taq-color-b8c0b7)]" : "bg-[var(--taq-color-112a46)]"}`}>{text(lang, "applyPeriod")}</button></div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StoreScopeTabs({ lang, selectedBusiness, setSelectedBusiness, businessesList = businesses }: {
  lang: AppLang;
  selectedBusiness: string;
  setSelectedBusiness: (value: string) => void;
  businessesList?: AppBusiness[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectorRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (businessesList.length === 1 && selectedBusiness !== businessesList[0].id) setSelectedBusiness(businessesList[0].id);
  }, [businessesList, selectedBusiness, setSelectedBusiness]);
  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event: PointerEvent) => { if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);
  if (businessesList.length <= 1) return null;
  const stores = [{ id: "all", label: text(lang, "allStores") }, ...businessesList.map((business) => ({ id: business.id, label: businessName(business, lang, true) || businessName(business, lang), business }))];
  if (businessesList.length <= 2) {
    return (
      <NotebookRow>
        <div className={`grid w-full items-end gap-2 ${stores.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
          {stores.map((store) => {
            const active = selectedBusiness === store.id;
            return <button key={store.id} onClick={() => setSelectedBusiness(store.id)} className={`relative min-w-0 pb-2 text-center text-xs font-black transition ${active ? "text-[var(--taq-color-b44747)]" : "text-[var(--taq-color-957d43)]"}`}><span className="relative inline-flex whitespace-nowrap">{store.label}{active && <span className="absolute -bottom-[9px] left-0 right-0 h-[2px] rounded-full bg-[var(--taq-color-c28a30)]" />}</span></button>;
          })}
        </div>
      </NotebookRow>
    );
  }
  const selectedStore = selectedBusiness === "all" ? null : businessesList.find((business) => business.id === selectedBusiness);
  const filtered = businessesList.filter((business) => `${businessName(business, lang)} ${businessLocation(business, lang)}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <NotebookRow className="justify-center">
      <div ref={selectorRef} className="relative pb-[8px]">
        <button onClick={() => setOpen(!open)} className={`inline-flex max-w-[238px] items-center justify-center gap-1.5 rounded-full px-3 py-1 text-taq-meta font-bold transition ${open ? "bg-[var(--taq-color-fff4d2)]/80 text-[var(--taq-color-b44747)]" : "text-[var(--taq-color-806528)]"}`}>
          <span className="truncate">{selectedBusiness === "all" ? text(lang, "allStores") : businessName(selectedStore, lang)}</span>
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-[var(--taq-color-806528)] transition ${open ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>{open && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute left-1/2 top-[38px] z-40 w-[270px] -translate-x-1/2 rounded-2xl bg-[var(--taq-color-fffdf7)] p-3 shadow-xl ring-1 ring-[var(--taq-color-d8cca8)]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text(lang, "searchStore")} className="mb-2 w-full rounded-xl bg-[var(--taq-color-f7f5ef)] px-3 py-2.5 text-taq-meta font-bold outline-none" />
          <button onClick={() => { setSelectedBusiness("all"); setOpen(false); }} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold ${selectedBusiness === "all" ? "bg-[var(--taq-color-fff0cb)] text-[var(--taq-color-b44747)]" : "text-[var(--taq-color-112a46)]"}`}><span>{text(lang, "allStores")}</span>{selectedBusiness === "all" && <Check className="h-4 w-4" />}</button>
          <div className="max-h-48 overflow-y-auto">{filtered.map((business) => <button key={business.id} onClick={() => { setSelectedBusiness(business.id); setOpen(false); setQuery(""); }} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start ${selectedBusiness === business.id ? "bg-[var(--taq-color-fff0cb)]" : ""}`}><div><p className="text-taq-meta font-black text-[var(--taq-color-112a46)]">{businessName(business, lang)}</p><p className="text-taq-nav font-bold text-[var(--taq-color-827762)]">{businessLocation(business, lang)}</p></div>{selectedBusiness === business.id && <Check className="h-4 w-4 text-[var(--taq-color-b44747)]" />}</button>)}</div>
        </motion.div>}</AnimatePresence>
      </div>
    </NotebookRow>
  );
}

function StoreComparison({ lang, monthly, businessesList = businesses }: {
  lang: AppLang;
  monthly: boolean;
  businessesList?: AppBusiness[];
}) {
  const [showStores, setShowStores] = useState(false);
  const total = combinedTotals(monthly, businessesList);
  if (businessesList.length > 2) {
    const ranked = [...businessesList].sort((a, b) => businessRecord(b, monthly).net - businessRecord(a, monthly).net);
    return (
      <div>
        <NotebookRow><NumberLine label={text(lang, "sales")} value={money(total.sales, lang)} /></NotebookRow>
        <NotebookRow><NumberLine label={text(lang, "outflow")} value={money(total.expense, lang)} valueClassName="text-[var(--taq-color-b44747)]" /></NotebookRow>
        <NotebookRow strong lines={2}><NumberLine label={text(lang, "result")} value={money(total.net, lang)} valueClassName={total.net < 0 ? "text-[var(--taq-color-b44747)]" : "text-[var(--taq-color-257844)]"} /></NotebookRow>
        <NotebookRow className="justify-center"><InkTab active={showStores} onClick={() => setShowStores(!showStores)} className="inline-flex items-center gap-1">{text(lang, showStores ? "hideStores" : "viewStores")}{showStores ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</InkTab></NotebookRow>
        {showStores && <div><NotebookRow><p className="text-taq-meta font-bold text-[var(--taq-color-806528)]">{text(lang, "storeResults")}</p></NotebookRow>{ranked.map((business) => { const record = businessRecord(business, monthly); return <NotebookRow key={business.id}><div className="flex w-full items-end justify-between text-xs"><span className="font-medium">{businessName(business, lang)}</span><strong className={`tabular-nums font-bold ${record.net < 0 ? "text-[var(--taq-color-b44747)]" : "text-[var(--taq-color-257844)]"}`}><MoneyValue value={money(record.net, lang)} /></strong></div></NotebookRow>; })}</div>}
      </div>
    );
  }
  return (
    <div>
      <NotebookRow><div className="grid w-full grid-cols-[1.05fr_1fr_1fr] gap-1 text-xs font-medium"><span>{text(lang, "sales")}</span>{businessesList.map((business) => <span key={business.id} className="text-center font-bold tabular-nums"><MoneyValue value={money(businessRecord(business, monthly).sales, lang)} /></span>)}</div></NotebookRow>
      <NotebookRow><div className="grid w-full grid-cols-[1.05fr_1fr_1fr] gap-1 text-xs font-medium"><span className="text-[var(--taq-color-b44747)]">{text(lang, "outflow")}</span>{businessesList.map((business) => <span key={business.id} className="text-center font-bold tabular-nums text-[var(--taq-color-b44747)]"><MoneyValue value={money(businessRecord(business, monthly).expense, lang)} /></span>)}</div></NotebookRow>
      <NotebookRow><div className="grid w-full grid-cols-[1.05fr_1fr_1fr] gap-1 text-xs font-medium"><span>{text(lang, "result")}</span>{businessesList.map((business) => { const value = businessRecord(business, monthly).net; return <span key={business.id} className={`text-center font-bold tabular-nums ${value < 0 ? "text-[var(--taq-color-b44747)]" : "text-[var(--taq-color-257844)]"}`}><MoneyValue value={money(value, lang)} /></span>; })}</div></NotebookRow>
      <NotebookRow strong><NumberLine label={text(lang, "combinedTotal")} value={money(total.net, lang)} valueClassName={total.net < 0 ? "text-[var(--taq-color-b44747)]" : "text-[var(--taq-color-257844)]"} /></NotebookRow>
    </div>
  );
}

function NotebookHeading({ lang, label = null, dateSelector = null, onShare = null }: {
  lang: AppLang;
  label?: ReactNode;
  dateSelector?: ReactNode;
  onShare?: (() => void) | null;
}) {
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
            <p className="whitespace-nowrap text-taq-body font-black leading-none text-[var(--taq-color-112a46)]">{label}</p>
            <span className="mt-2 block h-[2px] w-full rounded-full bg-[var(--taq-color-c28a30)]" />
            {onShare && (
              <button
                type="button"
                onClick={(event: React.MouseEvent) => { event.preventDefault(); event.stopPropagation(); onShare?.(); }}
                title={text(lang, "shareNotebook")}
                aria-label={text(lang, "shareNotebook")}
                className={`absolute top-[-5px] z-20 flex h-[28px] w-[28px] items-center justify-center rounded-full text-[var(--taq-color-112a46)]/78 transition hover:bg-[var(--taq-color-fff0cb)]/70 hover:text-[var(--taq-color-9a823e)] active:scale-95 ${lang === "ar" ? "-left-9" : "-right-9"}`}
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

function NotebookDateBar({ dateSelector }: { dateSelector: ReactNode }) {
  return <NotebookRow className="justify-end">{dateSelector}</NotebookRow>;
}

function SummaryLoadingRow({ lang, lines = 3 }: { lang: AppLang; lines?: number }) {
  return (
    <NotebookRow lines={lines}>
      <p className="w-full text-taq-meta font-bold text-[var(--taq-color-806528)]">
        {lang === "ar" ? "جاري تحميل الملخص…" : "Loading summary…"}
      </p>
    </NotebookRow>
  );
}

export {
  Notebook,
  ThemePicker,
  NotebookRow,
  NotebookInk,
  MoneyValue,
  NumberLine,
  FinancialRows,
  formatCalendarMonth,
  isoCalendarDate,
  todayIsoDate,
  monthSelectionValue,
  monthSelectionParts,
  DateSelector,
  StoreScopeTabs,
  StoreComparison,
  NotebookHeading,
  NotebookDateBar,
  SummaryLoadingRow,
};
