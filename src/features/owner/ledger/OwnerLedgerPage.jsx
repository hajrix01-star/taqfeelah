"use client";

/**
 * OwnerLedgerPage
 *
 * The new owner ledger: unified view of all operational entries and closeouts.
 *
 * Design principles:
 * - Zero duplicated filter logic — delegates entirely to owner-ledger-filters.js
 * - Zero duplicated calculations — delegates entirely to operational-analytics.ts
 * - Two view modes: "operations" (entries list) | "closeouts" (submitted closeouts)
 * - Filter panel with: period, store, status, type, actor, channel, attachment, pendingReview
 * - Summary header computed from filtered + scoped entries
 */

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  ReceiptText,
  X,
} from "lucide-react";
import { text } from "@/i18n/text";
import {
  money,
  businessName,
  formatCalendarDate,
  opDate,
  opTime,
  employeeName,
  operationDisplayLabel,
  signedEntryAmount,
  entryHasAttachment,
  newestEntries,
} from "@/utils/display-helpers";
import {
  entryIsActive,
  entryIsVoided,
  entriesInPeriod,
  summarizeEntries,
  monthSelectionValue,
} from "@/features/operations/operational-analytics";
import {
  DEFAULT_LEDGER_FILTERS,
  applyLedgerFilters,
  activeLedgerFilterCount,
  summarizeLedgerPeriod,
  ledgerActorOptions,
} from "@/features/owner/ledger/owner-ledger-filters";
import { Badge, MoneyValue, NotebookRow, NumberLine } from "@/features/daily-closeouts/NotebookAtoms";
import { DateSelector } from "@/features/owner/OwnerRegisterScreen";

// ─── LedgerEntryRow ──────────────────────────────────────────────

function LedgerEntryRow({ entry, lang, onOpenOperation, reviewEnabled }) {
  const isSale = entry.type === "summary";
  const voided = entryIsVoided(entry);
  const hasAttachment = entryHasAttachment(entry);
  const needsReview = reviewEnabled && !voided && hasAttachment && !entry.reviewed;
  return (
    <button
      type="button"
      onClick={() => onOpenOperation?.(entry)}
      className="flex w-full items-start gap-3 border-b border-[#F0ECE2] py-3 text-start last:border-0"
    >
      <div className={`mt-0.5 h-8 w-8 shrink-0 items-center justify-center rounded-xl flex ${isSale ? "bg-[#E6F5E9]" : "bg-[#FFF1EE]"}`}>
        {isSale
          ? <Check className="h-4 w-4 text-[#257844]" />
          : <ReceiptText className="h-4 w-4 text-[#B44747]" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={`truncate text-xs font-black ${voided ? "line-through opacity-50" : ""}`}>
            {operationDisplayLabel(entry, lang)}
          </p>
          <strong className={`shrink-0 tabular-nums text-xs font-black ${voided ? "opacity-50 line-through" : isSale ? "text-[#257844]" : "text-[#B44747]"}`}>
            <MoneyValue value={money(signedEntryAmount(entry), lang)} />
          </strong>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-taq-meta font-bold text-[#827762]">
          <span>{opDate(entry, lang)}</span>
          <span>·</span>
          <span>{opTime(entry, lang)}</span>
          {employeeName(entry, lang) && <><span>·</span><span>{employeeName(entry, lang)}</span></>}
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {voided && <Badge tone="warning">{text(lang, "voided")}</Badge>}
          {hasAttachment && <Badge tone="neutral">{lang === "ar" ? "صورة" : "Photo"}</Badge>}
          {needsReview && <Badge tone="pending">{lang === "ar" ? "تحتاج مراجعة" : "Needs review"}</Badge>}
        </div>
      </div>
    </button>
  );
}

// ─── LedgerCloseoutRow ───────────────────────────────────────────

function LedgerCloseoutRow({ closeout, lang, onReview, onReturn }) {
  const status = closeout.status || "submitted";
  const tone = status === "reviewed" ? "success" : status === "returned" ? "warning" : "pending";
  const statusLabel = status === "reviewed"
    ? (lang === "ar" ? "مُعتمدة" : "Approved")
    : status === "returned"
      ? (lang === "ar" ? "مُعادة" : "Returned")
      : (lang === "ar" ? "بانتظار المراجعة" : "Pending review");

  return (
    <div className="flex w-full items-start gap-3 border-b border-[#F0ECE2] py-3 last:border-0">
      <div className="mt-0.5 h-8 w-8 shrink-0 items-center justify-center rounded-xl flex bg-[#F0ECE2]">
        <FileText className="h-4 w-4 text-[#806528]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-black">
            {formatCalendarDate(closeout.date, lang)}
          </p>
          {closeout.totals?.totalSales != null && (
            <strong className="shrink-0 tabular-nums text-xs font-black text-[#257844]">
              <MoneyValue value={money(closeout.totals.totalSales, lang)} />
            </strong>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge tone={tone}>{statusLabel}</Badge>
          {status === "submitted" && onReview && (
            <button type="button" onClick={() => onReview(closeout)} className="rounded-xl bg-[#112A46] px-3 py-1.5 text-taq-nav font-black text-white">
              {lang === "ar" ? "اعتماد" : "Approve"}
            </button>
          )}
          {status === "submitted" && onReturn && (
            <button type="button" onClick={() => onReturn(closeout)} className="rounded-xl bg-[#F7F5EF] px-3 py-1.5 text-taq-nav font-black text-[#716753] ring-1 ring-[#E8E1D4]">
              {lang === "ar" ? "إعادة" : "Return"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LedgerFilterPanel ───────────────────────────────────────────

function LedgerFilterPanel({ lang, filters, actorOptions, channelOptions, staffList, onApply, onClose }) {
  const [draft, setDraft] = useState({ ...filters });
  const draftCount = activeLedgerFilterCount(draft);

  const update = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  const Chip = ({ id, label, field, value, tone = "default" }) => (
    <button
      type="button"
      onClick={() => update(field, value)}
      className={`rounded-full px-3 py-1.5 text-taq-nav font-black transition ${draft[field] === value ? "bg-[#112A46] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]"}`}
    >
      {label}
    </button>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[220] flex items-center justify-center bg-[#112A46]/45 p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <button type="button" onClick={onClose} className="absolute inset-0" aria-label={text(lang, "close")} />
        <motion.div
          dir={lang === "ar" ? "rtl" : "ltr"}
          initial={{ scale: 0.97, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.97, opacity: 0 }}
          className="relative z-10 flex max-h-[min(80dvh,560px)] w-full max-w-[400px] flex-col overflow-hidden rounded-[24px] bg-[#F8F6F0] shadow-[0_18px_48px_rgba(17,42,70,0.22)]"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-[#ECE6DA] px-5 py-4">
            <div>
              <p className="text-taq-meta font-bold text-[#827762]">{lang === "ar" ? "تصفية السجل" : "Filter ledger"}</p>
              <h3 className="text-base font-black text-[#112A46]">
                {lang === "ar" ? "الفلاتر" : "Filters"}
                {draftCount > 0 && <span className="ms-2 rounded-full bg-[#112A46] px-2 py-0.5 text-taq-nav font-black text-white">{draftCount}</span>}
              </h3>
            </div>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]" aria-label={text(lang, "close")}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Status */}
            <div>
              <p className="mb-2 text-taq-nav font-bold text-[#957D43]">{lang === "ar" ? "الحالة" : "Status"}</p>
              <div className="flex flex-wrap gap-2">
                <Chip field="status" value="all" label={lang === "ar" ? "الكل" : "All"} />
                <Chip field="status" value="active" label={lang === "ar" ? "نشطة" : "Active"} />
                <Chip field="status" value="voided" label={lang === "ar" ? "ملغاة" : "Voided"} />
              </div>
            </div>

            {/* Type */}
            <div>
              <p className="mb-2 text-taq-nav font-bold text-[#957D43]">{lang === "ar" ? "نوع العملية" : "Type"}</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { v: "all", ar: "الكل", en: "All" },
                  { v: "summary", ar: "مبيعات", en: "Sales" },
                  { v: "expense", ar: "مصروف", en: "Expense" },
                  { v: "purchases", ar: "مشتريات", en: "Purchases" },
                  { v: "withdrawal", ar: "سحب", en: "Withdrawal" },
                ].map((item) => (
                  <Chip key={item.v} field="type" value={item.v} label={lang === "ar" ? item.ar : item.en} />
                ))}
              </div>
            </div>

            {/* Actor */}
            {actorOptions.length > 0 && (
              <div>
                <p className="mb-2 text-taq-nav font-bold text-[#957D43]">{lang === "ar" ? "أدخلها" : "Entered by"}</p>
                <div className="flex flex-wrap gap-2">
                  <Chip field="actor" value="all" label={lang === "ar" ? "الجميع" : "Everyone"} />
                  {actorOptions.map((opt) => (
                    <Chip key={opt.id} field="actor" value={opt.id} label={opt.label} />
                  ))}
                </div>
              </div>
            )}

            {/* Sales channel */}
            {channelOptions.length > 0 && (
              <div>
                <p className="mb-2 text-taq-nav font-bold text-[#957D43]">{lang === "ar" ? "قناة البيع" : "Channel"}</p>
                <div className="flex flex-wrap gap-2">
                  <Chip field="salesChannel" value="all" label={lang === "ar" ? "الكل" : "All"} />
                  {channelOptions.map((ch) => (
                    <Chip key={ch.id} field="salesChannel" value={ch.id} label={ch.displayName || ch.nameAr || ch.nameEn || ch.id} />
                  ))}
                </div>
              </div>
            )}

            {/* Extras */}
            <div>
              <p className="mb-2 text-taq-nav font-bold text-[#957D43]">{lang === "ar" ? "إضافي" : "Extras"}</p>
              <div className="flex flex-col gap-2">
                {[
                  { field: "attachmentOnly", ar: "بمرفق فقط", en: "With attachment only" },
                  { field: "pendingReviewOnly", ar: "تحتاج مراجعة", en: "Needs review" },
                ].map((item) => (
                  <button
                    key={item.field}
                    type="button"
                    onClick={() => update(item.field, !draft[item.field])}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-black ring-1 transition ${draft[item.field] ? "bg-[#112A46] text-white ring-[#112A46]" : "bg-white text-[#112A46] ring-black/[0.06]"}`}
                  >
                    <span>{lang === "ar" ? item.ar : item.en}</span>
                    {draft[item.field] && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="shrink-0 grid grid-cols-[0.9fr_1.35fr] gap-3 border-t border-[#ECE6DA] p-5">
            <button
              type="button"
              onClick={() => { setDraft({ ...DEFAULT_LEDGER_FILTERS }); }}
              className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.06]"
            >
              {lang === "ar" ? "إعادة تعيين" : "Reset"}
            </button>
            <button
              type="button"
              onClick={() => onApply(draft)}
              className="rounded-2xl bg-[#112A46] py-3.5 text-xs font-black text-white"
            >
              {lang === "ar" ? "تطبيق" : "Apply"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── LedgerSummaryBar ─────────────────────────────────────────────

function LedgerSummaryBar({ lang, summary, entryCount }) {
  if (summary.mode === "channel") {
    return (
      <div className="flex items-center justify-between gap-3 px-5 py-3 bg-white border-b border-[#ECE6DA]">
        <div>
          <p className="text-taq-nav font-bold text-[#827762]">{summary.label}</p>
          <strong className="text-sm font-black text-[#112A46]">
            <MoneyValue value={money(summary.amount, lang)} />
          </strong>
        </div>
        <span className="text-taq-meta font-bold text-[#827762]">{entryCount} {lang === "ar" ? "عملية" : "entries"}</span>
      </div>
    );
  }
  return (
    <div className="bg-white border-b border-[#ECE6DA] px-5 py-3">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-taq-nav font-bold text-[#827762]">{lang === "ar" ? "مبيعات" : "Sales"}</p>
          <strong className="text-xs font-black text-[#257844] tabular-nums">
            <MoneyValue value={money(summary.sales ?? 0, lang)} />
          </strong>
        </div>
        <div>
          <p className="text-taq-nav font-bold text-[#827762]">{lang === "ar" ? "خارج" : "Outflow"}</p>
          <strong className="text-xs font-black text-[#B44747] tabular-nums">
            <MoneyValue value={money(summary.expense ?? 0, lang)} />
          </strong>
        </div>
        <div>
          <p className="text-taq-nav font-bold text-[#827762]">{lang === "ar" ? "صافي" : "Net"}</p>
          <strong className={`text-xs font-black tabular-nums ${(summary.net ?? 0) < 0 ? "text-[#B44747]" : "text-[#112A46]"}`}>
            <MoneyValue value={money(summary.net ?? 0, lang)} />
          </strong>
        </div>
      </div>
    </div>
  );
}

// ─── OwnerLedgerPage (main) ───────────────────────────────────────

export default function OwnerLedgerPage({
  lang,
  operationalEntries = [],
  closeouts = [],
  businessesList = [],
  archivedBusinessIds = [],
  storeChannelSettings = {},
  reviewEnabledForBusiness = () => false,
  onOpenOperation,
  onReviewCloseout,
  onReturnCloseout,
  onBack,
  notebookTheme = "yellow",
}) {
  const [viewMode, setViewMode] = useState("operations");
  const [period, setPeriod] = useState("month");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [customFrom, setCustomFrom] = useState(() => `${new Date().getFullYear()}-01-01`);
  const [customTo, setCustomTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedBusiness, setSelectedBusiness] = useState("all");
  const [filters, setFilters] = useState(DEFAULT_LEDGER_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  const activeBusinesses = useMemo(
    () => businessesList.filter((b) => !archivedBusinessIds.includes(b.id)),
    [businessesList, archivedBusinessIds],
  );

  // Scope to store
  const storeScoped = useMemo(() => {
    if (selectedBusiness === "all") return operationalEntries;
    return operationalEntries.filter((e) => e.businessId === selectedBusiness);
  }, [operationalEntries, selectedBusiness]);

  // Scope to period
  const periodScoped = useMemo(
    () => entriesInPeriod(storeScoped, null, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo),
    [storeScoped, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo],
  );

  // Apply ledger filters — no logic here, delegates to filter module
  const filteredEntries = useMemo(
    () => applyLedgerFilters(periodScoped, filters),
    [periodScoped, filters],
  );

  // Channel options for filter panel
  const channelOptions = useMemo(() => {
    const config = selectedBusiness === "all"
      ? Object.values(storeChannelSettings).flatMap((c) => c?.channels || [])
      : (storeChannelSettings[selectedBusiness]?.channels || []);
    const seen = new Set();
    return config.filter((ch) => {
      if (ch.retired || seen.has(ch.id)) return false;
      seen.add(ch.id);
      return true;
    });
  }, [storeChannelSettings, selectedBusiness]);

  // Actor options — delegates to filter module
  const actorOptions = useMemo(
    () => ledgerActorOptions(periodScoped, lang),
    [periodScoped, lang],
  );

  // Summary — delegates to filter module
  const summary = useMemo(
    () => summarizeLedgerPeriod(filteredEntries, filters.salesChannel, channelOptions, lang),
    [filteredEntries, filters.salesChannel, channelOptions, lang],
  );

  // Sorted visible entries — no calculation here
  const visibleEntries = useMemo(
    () => newestEntries(filteredEntries),
    [filteredEntries],
  );

  // Closeouts scoped to store + period
  const visibleCloseouts = useMemo(() => {
    let scoped = selectedBusiness === "all" ? closeouts : closeouts.filter((c) => c.storeId === selectedBusiness);
    const monthVal = monthSelectionValue(selectedMonth);
    if (period === "month") scoped = scoped.filter((c) => c.date?.startsWith(monthVal));
    else if (period === "day") scoped = scoped.filter((c) => c.date === selectedDate);
    return [...scoped].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [closeouts, selectedBusiness, period, selectedMonth, selectedDate]);

  const filterCount = activeLedgerFilterCount(filters);
  const BackIcon = lang === "ar" ? ChevronRight : ChevronLeft;

  return (
    <div className="flex h-full flex-col bg-[#F8F6F0]">
      {/* Header */}
      <div className="shrink-0 border-b border-[#ECE6DA] bg-white px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0ECE2]" aria-label={lang === "ar" ? "رجوع" : "Back"}>
            <BackIcon className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-base font-black text-[#112A46]">
            {lang === "ar" ? "سجل المالك" : "Owner Ledger"}
          </h1>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className={`relative flex h-9 items-center gap-1.5 rounded-xl px-3 text-taq-nav font-black ring-1 transition ${filterCount > 0 ? "bg-[#112A46] text-white ring-[#112A46]" : "bg-[#F7F5EF] text-[#112A46] ring-[#E8E1D4]"}`}
          >
            <Filter className="h-4 w-4" />
            {lang === "ar" ? "فلتر" : "Filter"}
            {filterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#E4B84A] text-[10px] font-black text-[#112A46]">{filterCount}</span>
            )}
          </button>
        </div>

        {/* Period selector */}
        <div className="mt-3">
          <DateSelector
            compact
            lang={lang}
            period={period}
            setPeriod={setPeriod}
            selectedDay={selectedDate}
            setSelectedDay={setSelectedDate}
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
        </div>

        {/* Store selector */}
        {activeBusinesses.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedBusiness("all")}
              className={`rounded-full px-3 py-1.5 text-taq-nav font-black transition ${selectedBusiness === "all" ? "bg-[#112A46] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]"}`}
            >
              {lang === "ar" ? "كل المحلات" : "All stores"}
            </button>
            {activeBusinesses.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBusiness(b.id)}
                className={`rounded-full px-3 py-1.5 text-taq-nav font-black transition ${selectedBusiness === b.id ? "bg-[#112A46] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]"}`}
              >
                {businessName(b, lang, true)}
              </button>
            ))}
          </div>
        )}

        {/* View mode tabs */}
        <div className="mt-3 flex gap-4 border-b border-transparent">
          {[
            { id: "operations", ar: "العمليات", en: "Entries" },
            { id: "closeouts", ar: "التقفيلات", en: "Closeouts" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setViewMode(tab.id)}
              className={`relative pb-2 text-taq-meta font-black transition ${viewMode === tab.id ? "text-[#112A46]" : "text-[#A99D87]"}`}
            >
              {lang === "ar" ? tab.ar : tab.en}
              {viewMode === tab.id && (
                <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] rounded-full bg-[#C28A30]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      {viewMode === "operations" && (
        <LedgerSummaryBar lang={lang} summary={summary} entryCount={visibleEntries.length} />
      )}

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {viewMode === "operations" ? (
          visibleEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
              <ReceiptText className="mb-3 h-10 w-10 text-[#D9D1C1]" />
              <p className="text-sm font-bold text-[#827762]">
                {lang === "ar" ? "لا توجد عمليات مطابقة" : "No matching entries"}
              </p>
              {filterCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilters(DEFAULT_LEDGER_FILTERS)}
                  className="mt-3 rounded-xl bg-[#F7F5EF] px-4 py-2 text-taq-nav font-black text-[#716753]"
                >
                  {lang === "ar" ? "إزالة الفلاتر" : "Clear filters"}
                </button>
              )}
            </div>
          ) : (
            <div className="px-5 pb-8">
              {visibleEntries.map((entry) => (
                <LedgerEntryRow
                  key={entry.id}
                  entry={entry}
                  lang={lang}
                  onOpenOperation={onOpenOperation}
                  reviewEnabled={reviewEnabledForBusiness(entry.businessId)}
                />
              ))}
            </div>
          )
        ) : (
          visibleCloseouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
              <FileText className="mb-3 h-10 w-10 text-[#D9D1C1]" />
              <p className="text-sm font-bold text-[#827762]">
                {lang === "ar" ? "لا توجد تقفيلات لهذه الفترة" : "No closeouts for this period"}
              </p>
            </div>
          ) : (
            <div className="px-5 pb-8">
              {visibleCloseouts.map((closeout) => (
                <LedgerCloseoutRow
                  key={`${closeout.id || closeout.closeoutId}:${closeout.date}`}
                  closeout={closeout}
                  lang={lang}
                  onReview={onReviewCloseout}
                  onReturn={onReturnCloseout}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* Filter panel */}
      {filterOpen && (
        <LedgerFilterPanel
          lang={lang}
          filters={filters}
          actorOptions={actorOptions}
          channelOptions={channelOptions}
          onApply={(nextFilters) => { setFilters(nextFilters); setFilterOpen(false); }}
          onClose={() => setFilterOpen(false)}
        />
      )}
    </div>
  );
}
