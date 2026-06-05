"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronDown, ChevronLeft, ChevronRight, FileSpreadsheet, FileText, Home, Plus, ReceiptText, Settings, X } from "lucide-react";
import { text } from "@/i18n/text";
import { money, businessName, operationDisplayLabel, signedEntryAmount, newestEntries, entryCategory, expenseCategories, outflowReportCategories, businesses, formatCalendarDate, opTime, employeeName } from "@/utils/display-helpers";
import { entryIsVoided, entryIsActive, entryHasAttachment } from "@/features/operations/operational-analytics";
import { Badge, MoneyValue, NotebookRow, NumberLine, FinancialRows, InkTab } from "@/features/daily-closeouts/NotebookAtoms";
import AttachmentPreview from "@/components/AttachmentPreview";
import { useDailyCloseouts } from "@/features/daily-closeouts/DailyCloseoutsProvider";
import PendingCloseoutsNotice from "@/features/owner-closeout-review/PendingCloseoutsNotice";
import OwnerCloseoutReviewPanel from "@/features/owner-closeout-review/OwnerCloseoutReviewPanel";
import ReturnCloseoutModal from "@/features/owner-closeout-review/ReturnCloseoutModal";
import { StoreComparison, DateSelector, NotebookHeading, NotebookMarginTools } from "@/features/owner/OwnerRegisterScreen";
import { isProductionAppMode } from "@/core/config/app-mode";
import OwnerLedgerPage from "@/features/owner/ledger/OwnerLedgerPage";



// ─── StoreScopeTabs ───────────────────────────────────
export function StoreScopeTabs({ lang, selectedBusiness, setSelectedBusiness, businessesList = businesses }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectorRef = useRef(null);
  useEffect(() => {
    if (businessesList.length === 1 && selectedBusiness !== businessesList[0].id) setSelectedBusiness(businessesList[0].id);
  }, [businessesList, selectedBusiness, setSelectedBusiness]);
  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => { if (selectorRef.current && !selectorRef.current.contains(event.target)) setOpen(false); };
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
            return <button key={store.id} onClick={() => setSelectedBusiness(store.id)} className={`relative min-w-0 pb-2 text-center text-xs font-black transition ${active ? "text-[#B44747]" : "text-[#957D43]"}`}><span className="relative inline-flex whitespace-nowrap">{store.label}{active && <span className="absolute -bottom-[9px] left-0 right-0 h-[2px] rounded-full bg-[#C28A30]" />}</span></button>;
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
        <button onClick={() => setOpen(!open)} className={`inline-flex max-w-[238px] items-center justify-center gap-1.5 rounded-full px-3 py-1 text-taq-meta font-bold transition ${open ? "bg-[#FFF4D2]/80 text-[#B44747]" : "text-[#806528]"}`}>
          <span className="truncate">{selectedBusiness === "all" ? text(lang, "allStores") : businessName(selectedStore, lang)}</span>
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-[#806528] transition ${open ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>{open && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute left-1/2 top-[38px] z-40 w-[270px] -translate-x-1/2 rounded-2xl bg-[#FFFDF7] p-3 shadow-xl ring-1 ring-[#D8CCA8]">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text(lang, "searchStore")} className="mb-2 w-full rounded-xl bg-[#F7F5EF] px-3 py-2.5 text-taq-meta font-bold outline-none" />
          <button onClick={() => { setSelectedBusiness("all"); setOpen(false); }} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold ${selectedBusiness === "all" ? "bg-[#FFF0CB] text-[#B44747]" : "text-[#112A46]"}`}><span>{text(lang, "allStores")}</span>{selectedBusiness === "all" && <Check className="h-4 w-4" />}</button>
          <div className="max-h-48 overflow-y-auto">{filtered.map((business) => <button key={business.id} onClick={() => { setSelectedBusiness(business.id); setOpen(false); setQuery(""); }} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start ${selectedBusiness === business.id ? "bg-[#FFF0CB]" : ""}`}><div><p className="text-taq-meta font-black text-[#112A46]">{businessName(business, lang)}</p><p className="text-taq-nav font-bold text-[#827762]">{businessLocation(business, lang)}</p></div>{selectedBusiness === business.id && <Check className="h-4 w-4 text-[#B44747]" />}</button>)}</div>
        </motion.div>}</AnimatePresence>
      </div>
    </NotebookRow>
  );
}


// ─── NotebookDateBar ───────────────────────────────────
export function NotebookDateBar({ dateSelector }) {
  return <NotebookRow className="justify-end">{dateSelector}</NotebookRow>;
}


// ─── OwnerHome ───────────────────────────────────
export function OwnerHome({ lang, operationalEntries = [], duplicateSalesAlerts = [], closeoutAlerts = [], pendingEmployeeCloseouts = [], onViewPendingCloseouts = () => {}, onReviewCloseout = () => {}, onDismissCloseout = () => {}, onReviewDuplicate = () => {}, onAcknowledgeDuplicate = () => {}, reviewEnabledForBusiness = () => false, onOpenOperation = () => {}, onShareNotebook = () => {}, notebookTheme = "yellow", selectedBusiness = "all", setSelectedBusiness = () => {}, reviewEnabled = false, businessesList = businesses }) {
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
  const daySummary = summaryDayFromEntries(operationalEntries, currentBusiness?.id, selectedDate, reviewEnabledForBusiness);
  const result = isCombined
    ? summarizeEntries(operationalEntries.filter((entry) => businessesList.some((business) => business.id === entry.businessId) && entryDateMatches(entry, period, selectedDate, selectedMonth, "2026", "2026-01-01", "2026-12-31")), reviewEnabledForBusiness)
    : monthly
      ? summaryMonthFromEntries(operationalEntries, currentBusiness?.id, selectedMonth, reviewEnabledForBusiness)
      : daySummary;
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
      {closeoutAlerts.length > 0 && <div className="mx-2 mb-3 rounded-2xl bg-[#E6F5E9] p-3 ring-1 ring-[#39A160]/15"><div className="flex items-start gap-2"><Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#257844]" /><div className="min-w-0 flex-1"><p className="text-taq-meta font-black text-[#257844]">{text(lang, "closeoutInAppAlert")}</p><p className="mt-1 text-taq-meta font-bold text-[#716753]">{businessName(businessesList.find((business) => business.id === closeoutAlerts[0].businessId), lang)} · {formatCalendarDate(closeoutAlerts[0].date, lang)} · {lang === "ar" ? closeoutAlerts[0].employeeNameAr : closeoutAlerts[0].employeeNameEn}</p><p className="mt-1 text-taq-meta font-bold text-[#827762]">{text(lang, "closeoutInAppHint")}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => onReviewCloseout(closeoutAlerts[0])} className="rounded-xl bg-white py-2.5 text-taq-meta font-black text-[#257844] ring-1 ring-[#39A160]/15">{text(lang, "reviewCloseout")}</button><button type="button" onClick={() => onDismissCloseout(closeoutAlerts[0].id)} className="rounded-xl bg-[#112A46] py-2.5 text-taq-meta font-black text-white">{text(lang, "dismissAlert")}</button></div></div>}
      {duplicateSalesAlerts.length > 0 && <div className="mx-2 mb-3 rounded-2xl bg-[#FFF1EE] p-3 ring-1 ring-[#B44747]/10"><div className="flex items-start gap-2"><Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#B44747]" /><div className="min-w-0 flex-1"><p className="text-taq-meta font-black text-[#B44747]">{text(lang, "duplicateSalesOwnerAlert")}</p><p className="mt-1 text-taq-meta font-bold text-[#716753]">{businessName(businessesList.find((business) => business.id === duplicateSalesAlerts[0].businessId), lang)} · {formatCalendarDate(duplicateSalesAlerts[0].date, lang)} · {duplicateSalesAlerts[0].entries.length} {text(lang, "summary")}</p><p className="mt-1 text-taq-meta font-bold text-[#827762]">{text(lang, "duplicateSalesOwnerHint")}</p></div></div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => onReviewDuplicate(duplicateSalesAlerts[0])} className="rounded-xl bg-white py-2.5 text-taq-meta font-black text-[#B44747] ring-1 ring-[#B44747]/10">{text(lang, "reviewInLog")}</button><button type="button" onClick={() => onAcknowledgeDuplicate(duplicateSalesAlerts[0])} title={text(lang, "approveMultipleSalesHint")} className="rounded-xl bg-[#112A46] py-2.5 text-taq-meta font-black text-white">{text(lang, "approveMultipleSales")}</button></div></div>}
      <Notebook fullPage theme={notebookTheme} lang={lang}>
        <NotebookHeading lang={lang} label={monthly ? text(lang, "monthlySummary") : text(lang, "dailySummary")} onShare={() => onShareNotebook({ theme: notebookTheme, period, selectedBusiness, includedBusinessIds: businessesList.map((business) => business.id), selectedDay: daySummary.id, selectedDate, selectedMonth, screen: "home", showDetails: expanded && !monthly && !isCombined })} dateSelector={<DateSelector compact lang={lang} period={period} setPeriod={changePeriod} selectedDay={selectedDay} setSelectedDay={(id) => { setSelectedDay(id); setShowAttachments(false); }} selectedDate={selectedDate} setSelectedDate={(date) => { setSelectedDate(date); setShowAttachments(false); }} fullCalendar selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />} />
        <StoreScopeTabs lang={lang} businessesList={businessesList} selectedBusiness={selectedBusiness} setSelectedBusiness={(id) => { setSelectedBusiness(id); setExpanded(false); setShowAttachments(false); }} />
        {isCombined ? (
          <div>
            <StoreComparison lang={lang} monthly={monthly} reviewEnabled={reviewEnabled} businessesList={scopedBusinesses} operationalEntries={operationalEntries} selectedDate={selectedDate} selectedMonth={selectedMonth} />
            <NotebookRow lines={2}><p className="w-full text-taq-meta font-bold text-[#806528]">{text(lang, "chooseStoreForDetails")}</p></NotebookRow>
          </div>
        ) : (
          <div>
            <NotebookRow><NumberLine lang={lang} handwritten label={text(lang, "sales")} value={money(result.sales, lang)} /></NotebookRow>
            <NotebookRow><NumberLine lang={lang} handwritten label={text(lang, "purchasesExpenses")} value={money(result.expense, lang)} valueClassName="text-[#B44747]" /></NotebookRow>
            <NotebookRow><div className="flex w-full items-end justify-between text-xs font-bold text-[#806528]"><span>{text(lang, "outflowRatio")}</span><strong className="text-[#B44747]">{result.ratio}</strong></div></NotebookRow>
            <NotebookRow strong lines={2}><div className="flex w-full items-end justify-between"><span className="text-sm font-extrabold">{monthly ? text(lang, "recordedMonthResult") : text(lang, "netMovement")}</span><strong className={`tabular-nums text-2xl font-extrabold ${result.net < 0 ? "text-[#B44747]" : "text-[#257844]"}`}><MoneyValue value={money(result.net, lang)} /></strong></div></NotebookRow>
            <NotebookRow>{monthly ? <div className="flex w-full items-end justify-between text-xs font-bold text-[#806528]"><span>{text(lang, "attachments")}</span><span>{result.proofs}{reviewEnabled && <> · <span className="text-[#B96725]">{result.pending} {text(lang, "notReviewed")}</span></>}</span></div> : <button onClick={() => setShowAttachments(!showAttachments)} className="flex w-full items-end justify-between text-xs font-bold text-[#806528]"><span className="relative pb-1">{text(lang, "attachments")}{showAttachments && <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] rounded-full bg-[#C28A30]" />}</span><span>{result.proofs}{reviewEnabled && <> · <span className="text-[#B96725]">{result.pending} {text(lang, "notReviewed")}</span></>}</span></button>}</NotebookRow>
            {!monthly && showAttachments && <DayAttachments lang={lang} group={attachmentGroup} reviewEnabled={reviewEnabledForBusiness(currentBusiness.id)} onOpenOperation={onOpenOperation} />}
            <NotebookRow className="justify-center"><InkTab active={expanded} showActiveUnderline={false} onClick={() => setExpanded(!expanded)} className="inline-flex items-center gap-1">{expanded ? text(lang, "hideDetails") : text(lang, "showMore")}{expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</InkTab></NotebookRow>
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
                        {opTime(item, lang)} · {entryHasAttachment(item) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}
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


// ─── LogFilterChip ───────────────────────────────────
export function LogFilterChip({ active, children, onClick, tone = "default" }) {
  const toneClass = {
    default: active ? "bg-[#112A46] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
    accent: active ? "bg-[#E4B84A] text-[#112A46]" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
    warn: active ? "bg-[#B96725] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
    danger: active ? "bg-[#B44747] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
    navy: active ? "bg-[#214B7B] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
  }[tone];
  return <button type="button" onClick={onClick} className={`rounded-full px-2.5 py-1 text-taq-meta font-black ${toneClass}`}>{children}</button>;
}


// ─── RegisterFiltersSheet ───────────────────────────────────
export function RegisterFiltersSheet({ lang, open, onClose, onApply, draft, setDraft, typeItems, expenseCategoryItems, actorOptions, salesChannelOptions }) {
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


// ─── LogStoreFilter ───────────────────────────────────
export function LogStoreFilter({ lang, businessesList = businesses, selectedBusiness, setSelectedBusiness, locked = false }) {
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


// ─── OutflowAnalysis ───────────────────────────────────
export function OutflowAnalysis({ lang, period, selectedBusiness, selectedDay, selectedDate, selectedMonth, selectedYear, customFrom, customTo, businessesList = businesses, operationalEntries = [], category = "all", setCategory = () => {}, showTransactions = false, setShowTransactions = () => {} }) {
  const visibleRecords = operationalEntries.filter((entry) => entryIsActive(entry) && entryIsOutflow(entry) && (selectedBusiness === "all" || entry.businessId === selectedBusiness) && (category === "all" || entryCategory(entry) === category) && entryDateMatches(entry, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo));
  const total = visibleRecords.reduce((sum, record) => sum + record.amount, 0);
  const average = visibleRecords.length ? total / visibleRecords.length : 0;
  const selectedCategoryLabel = category === "all" ? text(lang, "allCategories") : text(lang, outflowReportCategories.find((item) => item.id === category)?.label || "other");
  const totalLabel = category === "all" ? text(lang, "totalOutflow") : `${text(lang, "totalOutflow")} · ${selectedCategoryLabel}`;
  return <div><div className="flex min-h-[88px] flex-wrap content-center items-end gap-x-4 gap-y-3 pb-3 pt-2">{outflowReportCategories.map((item) => { const active = category === item.id; return <button key={item.id} onClick={() => setCategory(item.id)} className={`relative pb-1.5 text-taq-meta font-bold transition ${active ? "text-[#B44747]" : "text-[#806528]"}`}><span className="relative inline-flex whitespace-nowrap">{text(lang, item.label)}{active && <span className="absolute -bottom-[7px] left-0 right-0 h-[2px] rounded-full bg-[#C28A30]" />}</span></button>; })}</div><FinancialRows lang={lang} rows={[
    { id: "total", label: totalLabel, value: money(total, lang), valueClassName: "text-[#B44747]" },
    { id: "count", label: text(lang, "numberTransactions"), value: `${visibleRecords.length}` },
    { id: "average", label: text(lang, "averageTransaction"), value: money(average, lang), valueClassName: "text-[#806528]" },
  ]} /><NotebookRow className="justify-center"><InkTab active={showTransactions} onClick={() => setShowTransactions(!showTransactions)}>{text(lang, showTransactions ? "hideTransactions" : "viewTransactions")}</InkTab></NotebookRow>{showTransactions && (visibleRecords.length ? <div>{newestEntries(visibleRecords).map((record) => { const store = businessesList.find((business) => business.id === record.businessId); return <NotebookRow key={record.id} lines={2}><div className="w-full"><div className="mb-1 flex items-end justify-between text-xs"><strong className="font-medium text-[#112A46]">{text(lang, outflowReportCategories.find((item) => item.id === entryCategory(record))?.label || "other")}</strong><strong className="tabular-nums font-bold text-[#B44747]"><MoneyValue value={money(-record.amount, lang)} /></strong></div><div className="flex justify-between text-taq-meta font-bold text-[#806528]"><span>{formatCalendarDate(record.date, lang)} · {businessName(store, lang, true)}</span><span>{entryHasAttachment(record) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}</span></div></div></NotebookRow>; })}</div> : <NotebookRow><p className="text-xs font-bold text-[#806528]">{text(lang, "noOutflowPeriod")}</p></NotebookRow>)}</div>;
}


// ─── QuickAddSheet ───────────────────────────────────

export function QuickAddSheet({ lang, employee, open, onClose, onSummary, onExpense }) {
  if (!open) return null;
  const secondaryTitle = employee ? text(lang, "addPurchaseExpense") : text(lang, "addPaidByOwner");
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[70] flex items-end bg-[#112A46]/45 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0">
        <button onClick={onClose} className="absolute inset-0" aria-label={text(lang, "close")} />
        <motion.div initial={{ y: 18 }} animate={{ y: 0 }} exit={{ y: 18 }} className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-taq-meta font-bold text-[#827762]">{text(lang, "addOutflow")}</p>
              <h3 className="text-base font-black text-[#112A46]">{lang === "ar" ? "إضافة عملية" : "Add entry"}</h3>
            </div>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onSummary} className="flex min-h-[142px] flex-col items-start justify-between rounded-[24px] bg-[#112A46] p-4 text-start text-white">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10"><ReceiptText className="h-5 w-5" /></span>
              <span><strong className="block text-taq-meta font-black leading-5">{employee ? text(lang, "enterDailySummary") : text(lang, "enterOwnerSummary")}</strong><small className="mt-1 block text-taq-nav font-bold leading-4 text-white/65">{text(lang, "salesChannelsAndTotal")}</small></span>
            </button>
            <button onClick={onExpense} className="flex min-h-[142px] flex-col items-start justify-between rounded-[24px] bg-white p-4 text-start text-[#112A46] ring-1 ring-black/[0.055]">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF0CB] text-[#806528]"><Plus className="h-5 w-5" /></span>
              <span><strong className="block text-taq-meta font-black leading-5">{secondaryTitle}</strong><small className="mt-1 block text-taq-nav font-bold leading-4 text-[#827762]">{text(lang, "amountNoteOptionalPhoto")}</small></span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


// ─── OwnerHomeConnected ───────────────────────────────────
export function OwnerHomeConnected(props) {
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


// ─── OwnerRegisterConnected ───────────────────────────────────
export function OwnerRegisterConnected(props) {
  const { events } = useDailyCloseouts();
  return <OwnerRegisterScreen {...props} closeoutEvents={events} />;
}

// ─── OwnerLedgerConnected ─────────────────────────────────────
export function OwnerLedgerConnected(props) {
  const { closeouts } = useDailyCloseouts();
  return <OwnerLedgerPage {...props} closeouts={closeouts || []} />;
}


// ─── OwnerCloseoutModals ───────────────────────────────────
export function OwnerCloseoutModals({
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


// ─── BottomNav ───────────────────────────────────
export function BottomNav({ lang, employee, active, onChange, onAdd = () => {} }) {
  const NavButton = ({ item }) => { const Icon = item.icon; return <button onClick={() => onChange(item.id)} className={`flex min-w-[60px] flex-col items-center gap-0.5 text-taq-nav font-bold ${active === item.id ? "text-[#112A46]" : "text-[#A99D87]"}`}><Icon className="h-4.5 w-4.5" />{text(lang, item.key)}</button>; };
  if (employee) {
    return <EmployeeFooterNav lang={lang} onAdd={onAdd} />;
  }
  const leftItems = [{ id: "home", key: "home", icon: Home }, { id: "reports", key: "reports", icon: FileText }];
  const rightItems = [{ id: "ledger", key: "ledger", icon: ReceiptText }, { id: "settings", key: "settings", icon: Settings }];
  return (
    <nav className="taq-owner-nav relative z-30 flex h-[64px] w-full shrink-0 items-center justify-between border-t border-[#ECE6DA] bg-white/95 px-4 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex w-[122px] items-center justify-between">{leftItems.map((item) => <NavButton key={item.id} item={item} />)}</div>
      <button onClick={onAdd} aria-label={lang === "ar" ? "إضافة عملية" : "Add entry"} className="absolute left-1/2 top-0.5 flex h-[56px] w-[56px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[4px] border-[#F8F6F0] bg-[#E4B84A] text-[#112A46] shadow-sm"><Plus className="h-7 w-7" strokeWidth={2.4} /></button>
      <div className="w-[52px]" />
      <div className="flex w-[122px] items-center justify-between">{rightItems.map((item) => <NavButton key={item.id} item={item} />)}</div>
    </nav>
  );
}
