"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PROTOTYPE_BUILD_STAMP } from "@/prototype-build-stamp.mjs";
import { DailyCloseoutsProvider, useDailyCloseouts } from "@/features/daily-closeouts/DailyCloseoutsProvider";
import { buildOperationalEntriesFromCloseout } from "@/features/daily-closeouts/daily-closeouts-demo-store";
import { autoResolveSubmittedCloseoutsWithoutReview, readDailyCloseouts } from "@/features/daily-closeouts/daily-closeouts-demo-store";
import { readCloseoutEvents } from "@/features/daily-closeouts/daily-closeouts-demo-store";
import { applyNotebookThemeCssVariables, isValidNotebookTheme, notebookCardBackground, notebookLinesBackground, notebookThemes, resolveNotebookTheme } from "@/features/daily-closeouts/notebook-themes";
import { Badge, MoneyValue, NotebookInk, NotebookRow, NumberLine } from "@/features/daily-closeouts/NotebookAtoms";
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

function StoreScopeTabs({ lang, selectedBusiness, setSelectedBusiness, businessesList = businesses }) {
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




function NotebookDateBar({ dateSelector }) {
  return <NotebookRow className="justify-end">{dateSelector}</NotebookRow>;
}

function OwnerHome({ lang, operationalEntries = [], duplicateSalesAlerts = [], closeoutAlerts = [], pendingEmployeeCloseouts = [], onViewPendingCloseouts = () => {}, onReviewCloseout = () => {}, onDismissCloseout = () => {}, onReviewDuplicate = () => {}, onAcknowledgeDuplicate = () => {}, reviewEnabledForBusiness = () => false, onOpenOperation = () => {}, onShareNotebook = () => {}, notebookTheme = "yellow", selectedBusiness = "all", setSelectedBusiness = () => {}, reviewEnabled = false, businessesList = businesses }) {
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

function ProofThumb({ paper = false }) { return <div className={`${paper ? "h-12 w-10" : "h-14 w-14 bg-[#E8E1D4]"} flex shrink-0 items-center justify-center rounded-xl`}><div className={`${paper ? "w-9 border border-[#CFBC82]" : "w-9"} rotate-[-3deg] rounded bg-white p-1.5 shadow-sm`}><div className="mb-1 h-1 w-5 rounded bg-[#D8D1C4]" /><div className="mb-1 h-1 w-full rounded bg-[#E9E2D6]" /><div className="h-1 w-7 rounded bg-[#E9E2D6]" /></div></div>; }
function DayAttachments({ lang, group, reviewEnabled = false, onOpenOperation = () => {} }) { if (!group?.items?.length) return <NotebookRow><p className="text-xs font-bold text-[#806528]">{text(lang, "noAttachmentsDay")}</p></NotebookRow>; return <div className="py-3"><div className="flex gap-3 overflow-x-auto pb-1">{group.items.map((item) => <button key={item.id} onClick={() => onOpenOperation(item.entry)} className="min-w-[78px] text-center"><div className="mb-1 flex h-14 justify-center overflow-hidden rounded-xl"><AttachmentPreview attachment={item.attachment} className="h-14 w-14 rounded-xl" /></div><p className="truncate text-taq-meta font-bold">{lang === "ar" ? item.title : item.titleEn}</p><p className={`mt-0.5 text-taq-meta font-black ${item.entry.type === "summary" ? "text-[#257844]" : "text-[#B44747]"}`}><MoneyValue value={money(signedEntryAmount(item.entry), lang)} /></p>{reviewEnabled && !entryIsVoided(item.entry) && !item.reviewed && <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#B96725]" />}</button>)}</div></div>; }

function logPeriodScopeLabel(lang, period, selectedDate, selectedMonth, selectedYear, customFrom, customTo) {
  if (period === "day") return formatCalendarDate(selectedDate, lang);
  if (period === "month") return formatSelectedMonth(selectedMonth, lang);
  if (period === "year") return selectedYear;
  return `${formatCalendarDate(customFrom, lang)} — ${formatCalendarDate(customTo, lang)}`;
}

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

const DEFAULT_REGISTER_LOG_FILTERS = {
  status: "all",
  type: "all",
  expenseCategory: "all",
  attachmentOnly: false,
  pendingReviewOnly: false,
  actor: "all",
  salesChannel: "all",
};

function summarizeRegisterPeriod(entries, lang, salesChannelFilter, channelOptions = []) {
  const activeEntries = entries.filter(entryIsActive);
  if (salesChannelFilter !== "all") {
    const option = channelOptions.find((item) => item.id === salesChannelFilter);
    let amount = 0;
    activeEntries.forEach((entry) => {
      if (entry.type !== "summary") return;
      (entry.salesChannels || []).forEach((row) => {
        if (row.channelId === salesChannelFilter) amount += Number(row.amount) || 0;
      });
    });
    return {
      mode: "channel",
      label: option?.label || (lang === "ar" ? "قناة" : "Channel"),
      amount,
    };
  }
  const totals = summarizeEntries(entries);
  return { mode: "totals", sales: totals.sales, expense: totals.expense, net: totals.net };
}

function registerLogFilterCount(filters) {
  return Number(filters.status !== "all")
    + Number(filters.type !== "all")
    + Number(filters.expenseCategory !== "all")
    + Number(filters.salesChannel !== "all")
    + Number(filters.attachmentOnly)
    + Number(filters.pendingReviewOnly)
    + Number(filters.actor !== "all");
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


function OutflowAnalysis({ lang, period, selectedBusiness, selectedDay, selectedDate, selectedMonth, selectedYear, customFrom, customTo, businessesList = businesses, operationalEntries = [], category = "all", setCategory = () => {}, showTransactions = false, setShowTransactions = () => {} }) {
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



function OperationModal({ lang, item, onClose, onReview, onVoid, onRestore, reviewEnabled = false, canVoid = true, canRestore = true }) {
  const attachmentSource = useAttachmentSource(item?.attachment);
  const [attachmentOpen, setAttachmentOpen] = useState(false);

  useEffect(() => {
    setAttachmentOpen(false);
  }, [item?.id]);

  if (!item) return null;
  const isSale = item.type === "summary";
  const voided = entryIsVoided(item);

  return (
    <>
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 flex items-end bg-[#112A46]/35 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0">
          <div className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8">
            <div className="mb-4 flex justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={isSale ? "success" : "warning"}>{operationDisplayLabel(item, lang)}</Badge>
                {voided && <Badge tone="warning">{text(lang, "voided")}</Badge>}
                {!voided && entryWasRestored(item) && <Badge tone="success">{text(lang, "restored")}</Badge>}
                {!voided && item.reviewed && <Badge tone="success">{text(lang, "reviewed")}</Badge>}
                <h3 className="mt-2 w-full text-lg font-black">{noteLabel(item, lang)}</h3>
              </div>
              <button type="button" onClick={onClose}><X className="h-5 w-5" /></button>
            </div>

            <div className="mb-4 rounded-2xl bg-white p-4 text-sm">
              <div className="mb-2 flex justify-between"><span>{text(lang, "amount")}</span><strong className={`${voided ? "line-through opacity-60" : ""} ${isSale ? "text-[#257844]" : "text-[#B44747]"}`}>{money(signedEntryAmount(item), lang)}</strong></div>
              <div className="mb-2 flex justify-between"><span>{text(lang, "time")}</span><strong>{opDate(item, lang)} · {opTime(item, lang)}</strong></div>
              <div className="flex justify-between"><span>{text(lang, "enteredBy")}</span><strong>{employeeName(item, lang)}</strong></div>
              {voided && (
                <div className="mt-3 border-t border-[#F0ECE2] pt-3">
                  <div className="flex justify-between text-[#B44747]"><span>{text(lang, "status")}</span><strong>{text(lang, "voidedByOwner")}</strong></div>
                  {item.voidReason && <div className="mt-2 flex justify-between gap-3 text-taq-meta text-[#716753]"><span>{text(lang, "voidReason")}</span><strong className="text-end">{item.voidReason}</strong></div>}
                </div>
              )}
              {!voided && entryWasRestored(item) && (
                <div className="mt-3 border-t border-[#F0ECE2] pt-3">
                  <div className="flex justify-between text-[#257844]"><span>{text(lang, "status")}</span><strong>{text(lang, "restoredByOwner")}</strong></div>
                  {item.restoreReason && <div className="mt-2 flex justify-between gap-3 text-taq-meta text-[#716753]"><span>{text(lang, "restoreReason")}</span><strong className="text-end">{item.restoreReason}</strong></div>}
                </div>
              )}
            </div>

            {(item.auditTrail || []).length > 0 && (
              <div className="mb-4 rounded-2xl bg-white p-4">
                <p className="mb-3 text-xs font-black text-[#112A46]">{text(lang, "auditTrail")}</p>
                <div className="space-y-2">
                  {item.auditTrail.map((action, index) => (
                    <div key={`${action.action}-${action.at}-${index}`} className="flex items-start justify-between gap-3 text-taq-meta font-bold">
                      <div className="flex items-start gap-2">
                        <span className={`mt-1 h-2 w-2 rounded-full ${action.action === "voided" ? "bg-[#B44747]" : action.action === "restored" || action.action === "reviewed" || action.action === "duplicate_approved" ? "bg-[#257844]" : "bg-[#806528]"}`} />
                        <div>
                          <p>{text(lang, action.action === "created" ? "actionCreated" : action.action === "voided" ? "actionVoided" : action.action === "restored" ? "actionRestored" : action.action === "reviewed" ? "actionReviewed" : "actionDuplicateApproved")}</p>
                          <p className="mt-0.5 font-medium text-[#827762]">{action.by ? (lang === "ar" ? action.by.nameAr : action.by.nameEn) : "-"}</p>
                          {action.reason && <p className="mt-0.5 font-medium text-[#827762]">{action.reason}</p>}
                        </div>
                      </div>
                      <span className="shrink-0 text-end text-[#827762]">{auditDateTime(action.at, lang)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {entryHasAttachment(item) && (
              <div className="mb-4 overflow-hidden rounded-2xl bg-[#E9E2D5]">
                <button
                  type="button"
                  className="w-full"
                  onClick={() => {
                    if (attachmentSource) setAttachmentOpen(true);
                  }}
                >
                  <AttachmentPreview attachment={item.attachment} className="h-52 w-full" />
                </button>
                <p className="border-t border-[#D9CEBA] px-3 py-2 text-center text-taq-meta font-bold text-[#716753]">
                  {text(lang, "openAttachment")}
                </p>
              </div>
            )}

            {reviewEnabled && !voided && entryHasAttachment(item) && !item.reviewed && <button onClick={() => onReview(item.id)} className="mb-3 w-full rounded-2xl bg-[#39A160] py-4 text-sm font-extrabold text-white">{text(lang, "confirmReview")}</button>}
            {canRestore && voided && <button onClick={() => onRestore(item.id)} className="w-full rounded-2xl bg-[#E6F5E9] py-4 text-sm font-extrabold text-[#257844]">{text(lang, "restoreEntry")}</button>}
            {canVoid && !voided && <button onClick={() => onVoid(item.id)} className="w-full rounded-2xl bg-[#FFF1EE] py-4 text-sm font-extrabold text-[#B44747]">{text(lang, "voidEntry")}</button>}
          </div>
        </motion.div>
      </AnimatePresence>
      <AttachmentLightbox
        open={attachmentOpen}
        src={attachmentSource}
        lang={lang}
        onClose={() => setAttachmentOpen(false)}
      />
    </>
  );
}

function DuplicateSalesDialog({ lang, draft, previousEntries = [], businessesList = businesses, onCancel, onConfirm }) {
  if (!draft) return null;
  const store = businessesList.find((business) => business.id === draft.businessId);
  const newAmount = (draft.salesChannels || []).reduce((sum, row) => sum + row.amount, 0);
  const previousTotal = previousEntries.reduce((sum, entry) => sum + entry.amount, 0);
  return <AnimatePresence><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] flex items-end bg-[#112A46]/50 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0"><motion.div initial={{ y: 18 }} animate={{ y: 0 }} exit={{ y: 18 }} className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8"><div className="mb-4 flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF1EE] text-[#B44747]"><Bell className="h-5 w-5" /></div><button onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]"><X className="h-4 w-4" /></button></div><h3 className="text-base font-black">{text(lang, "duplicateSalesTitle")}</h3><p className="mt-2 text-taq-meta font-bold leading-6 text-[#716753]">{text(lang, "duplicateSalesWarning")}</p><div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/[0.045]"><p className="text-taq-meta font-black text-[#112A46]">{businessName(store, lang)} · {formatCalendarDate(draft.date, lang)}</p><div className="mt-3 flex justify-between text-xs font-bold text-[#827762]"><span>{text(lang, "previousSalesEntries")} ({previousEntries.length})</span><strong>{money(previousTotal, lang)}</strong></div><div className="mt-2 flex justify-between border-t border-[#F0ECE2] pt-2 text-xs font-black"><span>{text(lang, "summary")}</span><strong className="text-[#257844]">+{money(newAmount, lang)}</strong></div></div><div className="mt-5 grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={onCancel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.06]">{text(lang, "cancel")}</button><button onClick={onConfirm} className="rounded-2xl bg-[#B44747] py-3.5 text-xs font-black text-white">{text(lang, "saveAdditionalEntry")}</button></div></motion.div></motion.div></AnimatePresence>;
}

function VoidOperationDialog({ lang, item, onCancel, onConfirm }) {
  const [reason, setReason] = useState("");
  useEffect(() => { setReason(""); }, [item?.id]);
  if (!item) return null;
  const isSale = item.type === "summary";
  return <AnimatePresence><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] flex items-end bg-[#112A46]/50 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0"><motion.div initial={{ y: 18 }} animate={{ y: 0 }} exit={{ y: 18 }} className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8"><div className="mb-4 flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF1EE] text-[#B44747]"><X className="h-5 w-5" /></div><button onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]"><X className="h-4 w-4" /></button></div><h3 className="text-base font-black">{text(lang, "voidDialogTitle")}</h3><p className="mt-2 text-taq-meta font-bold leading-6 text-[#716753]">{text(lang, "voidConfirm")}</p><div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/[0.045]"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Badge tone={isSale ? "success" : "warning"}>{operationDisplayLabel(item, lang)}</Badge><span className="text-taq-meta font-bold text-[#827762]">{opDate(item, lang)}</span></div><strong className={`tabular-nums text-sm font-black ${isSale ? "text-[#257844]" : "text-[#B44747]"}`}>{money(signedEntryAmount(item), lang)}</strong></div></div><div className="mt-4"><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "voidReasonPrompt")}</p><textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={160} placeholder={text(lang, "voidReasonPrompt")} className="min-h-[72px] w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm font-bold outline-none ring-1 ring-black/[0.05]" /></div><div className="mt-5 grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={onCancel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.06]">{text(lang, "cancel")}</button><button onClick={() => onConfirm(reason.trim())} className="rounded-2xl bg-[#B44747] py-3.5 text-xs font-black text-white">{text(lang, "confirmVoid")}</button></div></motion.div></motion.div></AnimatePresence>;
}
function RestoreOperationDialog({ lang, item, onCancel, onConfirm }) {
  const [reason, setReason] = useState("");
  useEffect(() => { setReason(""); }, [item?.id]);
  if (!item) return null;
  const isSale = item.type === "summary";
  return <AnimatePresence><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] flex items-end bg-[#112A46]/50 sm:items-center sm:justify-center sm:p-6 lg:items-end lg:justify-start lg:p-0"><motion.div initial={{ y: 18 }} animate={{ y: 0 }} exit={{ y: 18 }} className="relative z-10 w-full rounded-t-[30px] bg-[#F8F6F0] p-5 pb-8 sm:max-w-[560px] sm:rounded-[30px] sm:p-6 lg:max-w-none lg:rounded-t-[30px] lg:rounded-b-none lg:p-5 lg:pb-8"><div className="mb-4 flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E6F5E9] text-[#257844]"><Check className="h-5 w-5" /></div><button onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-black/[0.05]"><X className="h-4 w-4" /></button></div><h3 className="text-base font-black">{text(lang, "restoreDialogTitle")}</h3><p className="mt-2 text-taq-meta font-bold leading-6 text-[#716753]">{text(lang, "restoreConfirm")}</p><div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-black/[0.045]"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Badge tone={isSale ? "success" : "warning"}>{operationDisplayLabel(item, lang)}</Badge><span className="text-taq-meta font-bold text-[#827762]">{opDate(item, lang)}</span></div><strong className={`tabular-nums text-sm font-black ${isSale ? "text-[#257844]" : "text-[#B44747]"}`}>{money(signedEntryAmount(item), lang)}</strong></div></div><div className="mt-4"><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "restoreReasonPrompt")}</p><textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={160} placeholder={text(lang, "restoreReasonPrompt")} className="min-h-[72px] w-full resize-none rounded-2xl bg-white px-4 py-3 text-sm font-bold outline-none ring-1 ring-black/[0.05]" /></div><div className="mt-5 grid grid-cols-[0.9fr_1.35fr] gap-3"><button onClick={onCancel} className="rounded-2xl bg-white py-3.5 text-xs font-black ring-1 ring-black/[0.06]">{text(lang, "cancel")}</button><button onClick={() => onConfirm(reason.trim())} className="rounded-2xl bg-[#257844] py-3.5 text-xs font-black text-white">{text(lang, "confirmRestore")}</button></div></motion.div></motion.div></AnimatePresence>;
}
function QuickAddSheet({ lang, employee, open, onClose, onSummary, onExpense }) {
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
  const { events } = useDailyCloseouts();
  return <OwnerRegisterScreen {...props} closeoutEvents={events} />;
}

function formatDateTimeLabel(iso, lang) {
  if (!iso) return "";
  const datePart = iso.slice(0, 10);
  const time = new Date(iso).toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" });
  return `${formatCalendarDate(datePart, lang)} · ${time}`;
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

function BottomNav({ lang, employee, active, onChange, onAdd = () => {} }) {
  const NavButton = ({ item }) => { const Icon = item.icon; return <button onClick={() => onChange(item.id)} className={`flex min-w-[60px] flex-col items-center gap-0.5 text-taq-nav font-bold ${active === item.id ? "text-[#112A46]" : "text-[#A99D87]"}`}><Icon className="h-4.5 w-4.5" />{text(lang, item.key)}</button>; };
  if (employee) {
    return <EmployeeFooterNav lang={lang} onAdd={onAdd} />;
  }
  const leftItems = [{ id: "home", key: "home", icon: Home }, { id: "reports", key: "reports", icon: FileText }];
  const rightItems = [{ id: "register", key: "register", icon: ReceiptText }, { id: "settings", key: "settings", icon: Settings }];
  return (
    <nav className="taq-owner-nav relative z-30 flex h-[64px] w-full shrink-0 items-center justify-between border-t border-[#ECE6DA] bg-white/95 px-4 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex w-[122px] items-center justify-between">{leftItems.map((item) => <NavButton key={item.id} item={item} />)}</div>
      <button onClick={onAdd} aria-label={lang === "ar" ? "إضافة عملية" : "Add entry"} className="absolute left-1/2 top-0.5 flex h-[56px] w-[56px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[4px] border-[#F8F6F0] bg-[#E4B84A] text-[#112A46] shadow-sm"><Plus className="h-7 w-7" strokeWidth={2.4} /></button>
      <div className="w-[52px]" />
      <div className="flex w-[122px] items-center justify-between">{rightItems.map((item) => <NavButton key={item.id} item={item} />)}</div>
    </nav>
  );
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
        const refreshed = await loadOperationalEntriesFromApi();
        if (payload.type === "summary") {
          const latestActiveCloseoutDate = refreshed
            .filter((entry) => entry.businessId === payload.businessId && entry.type === "summary" && entryIsActive(entry))
            .map((entry) => entry.date)
            .sort()
            .pop();
          setLastCloseoutDates((current) => ({
            ...current,
            [payload.businessId]: latestActiveCloseoutDate || payload.date,
          }));
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
        const refreshed = await loadOperationalEntriesFromApi();
        if (payload.type === "summary") {
          const latestActiveCloseoutDate = refreshed
            .filter((entry) => entry.businessId === payload.businessId && entry.type === "summary" && entryIsActive(entry))
            .map((entry) => entry.date)
            .sort()
            .pop();
          setLastCloseoutDates((current) => ({
            ...current,
            [payload.businessId]: latestActiveCloseoutDate || payload.date,
          }));
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
        const voided = await voidStoreEntryViaApi({
          organizationId: closeoutsApiOrganizationId,
          actorUserId: ownerApiUserId,
          actorRole: "owner",
          entry: target,
          reason: reason.trim(),
        });
        if (!voided) {
          window.alert(lang === "ar" ? "تعذر إلغاء العملية على الخادم." : "Failed to void entry on server.");
          return;
        }
        const refreshed = await loadOperationalEntriesFromApi();
        if (target.type === "summary") {
          const latestActiveCloseoutDate = refreshed
            .filter((entry) => entry.businessId === target.businessId && entry.type === "summary" && entryIsActive(entry))
            .map((entry) => entry.date)
            .sort()
            .pop();
          setLastCloseoutDates((current) => {
            const next = { ...current };
            if (latestActiveCloseoutDate) next[target.businessId] = latestActiveCloseoutDate;
            else delete next[target.businessId];
            return next;
          });
        }
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
        const restored = await restoreStoreEntryViaApi({
          organizationId: closeoutsApiOrganizationId,
          actorUserId: ownerApiUserId,
          actorRole: "owner",
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

  const createOperationalEntryInApi = useCallback(async ({ payload, actorUserId, actorRole }) => {
    if (!entriesApiEnabled) {
      if (entriesApiStrictMode) throw new Error("entries API is disabled in production mode.");
      return null;
    }
    if (!isUuid(closeoutsApiOrganizationId)) {
      if (entriesApiStrictMode) throw new Error("organization id is missing/invalid for entries API.");
      return null;
    }
    return createStoreEntryViaApi({
      organizationId: closeoutsApiOrganizationId,
      actorUserId,
      actorRole,
      payload,
    });
  }, [closeoutsApiOrganizationId, entriesApiEnabled, entriesApiStrictMode]);

  const loadOperationalEntriesFromApi = useCallback(async () => {
    if (!entriesApiEnabled) {
      if (entriesApiStrictMode) throw new Error("entries API is disabled in production mode.");
      return [];
    }
    if (!isUuid(closeoutsApiOrganizationId)) {
      if (entriesApiStrictMode) throw new Error("organization id is missing/invalid for entries API.");
      return [];
    }
    if (!isUuid(apiActorUserId)) {
      if (entriesApiStrictMode) throw new Error("actor user id is missing/invalid for entries API.");
      return [];
    }

    const targetStoreIds = apiTargetStoreIdsKey ? apiTargetStoreIdsKey.split("|").filter(Boolean) : [];
    if (!targetStoreIds.length) {
      setOperationalEntries([]);
      setOperationalEntriesSyncError("");
      return [];
    }

    const dateTo = todayIsoDate();
    const dateFrom = isoDaysAgo(365);

    const fetched = await Promise.all(
      targetStoreIds.map((storeId) => fetchStoreEntriesViaApi({
        organizationId: closeoutsApiOrganizationId,
        actorUserId: apiActorUserId,
        actorRole: apiActorRole,
        storeId,
        dateFrom,
        dateTo,
        status: "all",
        limit: 1000,
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
    return deduped;
  }, [
    apiActorRole,
    apiActorUserId,
    apiTargetStoreIdsKey,
    closeoutsApiOrganizationId,
    entriesApiEnabled,
    entriesApiStrictMode,
  ]);

  const syncSubmitCloseoutToApi = useCallback(async ({ action, closeout, employee, reviewWorkflowEnabled }) => {
    if (!closeoutsApiEnabled) {
      if (closeoutsApiStrictMode) throw new Error("closeouts API is disabled in production mode.");
      return null;
    }
    const actorUserId = employee?.apiUserId || employee?.id;
    if (!isUuid(closeoutsApiOrganizationId) || !isUuid(actorUserId) || !isUuid(closeout?.storeId)) {
      if (closeoutsApiStrictMode) throw new Error("closeouts API mapping is invalid for submit.");
      return null;
    }
    const result = await submitCloseoutViaApi({
      organizationId: closeoutsApiOrganizationId,
      actorUserId,
      actorRole: "employee",
      closeout,
      mode: action === "resubmit" ? "resubmit" : "submit",
      autoReview: !reviewWorkflowEnabled,
    });
    if (entriesApiStrictMode) {
      await loadOperationalEntriesFromApi();
    }
    return result;
  }, [
    closeoutsApiEnabled,
    closeoutsApiOrganizationId,
    closeoutsApiStrictMode,
    entriesApiStrictMode,
    loadOperationalEntriesFromApi,
  ]);

  const syncReviewCloseoutToApi = useCallback(async ({ action, closeout, reason = "" }) => {
    if (!closeoutsApiEnabled) {
      if (closeoutsApiStrictMode) throw new Error("closeouts API is disabled in production mode.");
      return null;
    }
    if (!isUuid(closeoutsApiOrganizationId) || !isUuid(ownerApiUserId) || !isUuid(closeout?.storeId)) {
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
    if (entriesApiStrictMode) {
      await loadOperationalEntriesFromApi();
    }
    return result;
  }, [
    closeoutsApiEnabled,
    closeoutsApiOrganizationId,
    ownerApiUserId,
    closeoutsApiStrictMode,
    entriesApiStrictMode,
    loadOperationalEntriesFromApi,
  ]);

  const loadCloseoutsFromApi = useCallback(async () => {
    if (!closeoutsApiEnabled) {
      if (closeoutsApiStrictMode) throw new Error("closeouts API is disabled in production mode.");
      return [];
    }
    if (!isUuid(closeoutsApiOrganizationId)) {
      if (closeoutsApiStrictMode) throw new Error("organization id is missing/invalid for closeouts API.");
      return [];
    }

    if (!isUuid(apiActorUserId)) {
      if (closeoutsApiStrictMode) throw new Error("actor user id is missing/invalid for closeouts API.");
      return [];
    }

    const targetStoreIds = apiTargetStoreIdsKey ? apiTargetStoreIdsKey.split("|").filter(Boolean) : [];
    if (!targetStoreIds.length) return [];

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

