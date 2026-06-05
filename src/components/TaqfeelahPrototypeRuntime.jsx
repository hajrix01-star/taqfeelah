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
import { OwnerHome, OwnerCloseoutModals, OwnerHomeConnected, OwnerRegisterConnected, OwnerLedgerConnected, StoreScopeTabs, QuickAddSheet, BottomNav, DayAttachments, RegisterFiltersSheet, LogStoreFilter, NotebookDateBar, OutflowAnalysis, LogFilterChip } from "@/features/owner/OwnerHomeScreen";
import { OperationModal, DuplicateSalesDialog, VoidOperationDialog, RestoreOperationDialog } from "@/features/entries/client/EntryDialogs";
import OwnerRegisterScreen from "@/features/owner/OwnerRegisterScreen";
import { DateSelector, StoreComparison, NotebookHeading, NotebookMarginTools } from "@/features/owner/OwnerRegisterScreen";
import NotebookShareModal from "@/features/owner/NotebookShareModal";
import { SavedOutflowShareDialog } from "@/features/owner/NotebookShareModal";
import ReportsScreen from "@/features/owner/ReportsScreen";
import { businessName, businessLocation, businessRecord, money, channelName, expenseCategories, outflowReportCategories, emptyStoreRecord, businesses, opDate, opTime, auditDateTime, employeeName, fullDate, shortDate, formatCalendarDate, formatCalendarMonth, todayIsoDate, nextDayIso, isoCalendarDate, signedEntryAmount, entryWasRestored, entryCategory, noteLabel, operationDisplayLabel, newestEntries, attachmentsFromEntries } from "@/utils/display-helpers";
import { entryIsActive, entryIsVoided, entryHasAttachment, entryIsOutflow, monthSelectionValue, entriesInPeriod, summarizeEntries, summaryMonthFromEntries, aggregateChannels, duplicateSalesSignature, duplicateSalesGroupKey } from "@/features/operations/operational-analytics";
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

// ─── App mode constants ──────────────────────────────────────────────────────
const APP_IN_PRODUCTION_MODE = isProductionAppMode();
const PRODUCTION_API_ENTRIES_MODE = APP_IN_PRODUCTION_MODE;

// ─── Prototype credentials (used in owner settings initial state) ─────────────
const PROTOTYPE_OWNER_USERNAME = (
  process.env.NEXT_PUBLIC_DEMO_OWNER_USERNAME || (APP_IN_PRODUCTION_MODE ? "hajri" : "owner")
).trim().toLowerCase();
const PROTOTYPE_OWNER_PASSWORD = process.env.NEXT_PUBLIC_DEMO_OWNER_PASSWORD || (APP_IN_PRODUCTION_MODE ? "" : "demo123");

// ─── Module-level constants ──────────────────────────────────────────────────
const PROTOTYPE_SUPPORT_WHATSAPP = "966501234567";
const CLOSEOUT_ALERTS_STORAGE_KEY = "taqfeelah_closeout_alerts_v1";
const OPERATIONAL_ENTRIES_STORAGE_KEY = PROTOTYPE_DEMO_OPERATIONAL_ENTRIES_KEY;
const ACKNOWLEDGED_DUPLICATE_SALES_STORAGE_KEY = "taqfeelah_acknowledged_duplicate_sales_v1";
const LAST_CLOSEOUT_STORAGE_KEY = PROTOTYPE_DEMO_LAST_CLOSEOUT_KEY;
const MAX_ENTRY_AMOUNT = 9999999;
const ownerActor = { role: "owner", userId: "owner", nameAr: "محمد الهاجري", nameEn: "Mohammad Alhajri" };

// ─── Entry amount helpers ─────────────────────────────────────────────────────
const westernizeDigits = (value = "") => String(value).replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
function sanitizeAmountInput(value) {
  const cleaned = westernizeDigits(value).replace(/[٬, ]/g, "").replace(/٫/g, ".").replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  const integer = (parts[0] || "").replace(/^0+(?=[0-9])/, "");
  const decimal = parts.slice(1).join("").slice(0, 2);
  const normalized = parts.length > 1 ? `${integer || "0"}.${decimal}` : integer;
  if (Number(normalized || 0) > MAX_ENTRY_AMOUNT) return String(MAX_ENTRY_AMOUNT);
  return normalized;
}
const toAmount = (value) => {
  const parsed = Number(sanitizeAmountInput(value));
  return Number.isFinite(parsed) && parsed >= 0 ? Math.min(parsed, MAX_ENTRY_AMOUNT) : 0;
};
const newId = (prefix = "entry") => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// ─── Entry builder ────────────────────────────────────────────────────────────
function buildEntry(payload, actor) {
  const id = newId(payload.type);
  const createdAt = new Date().toISOString();
  const amount = payload.type === "summary"
    ? (payload.salesChannels || []).reduce((sum, row) => sum + row.amount, 0)
    : toAmount(payload.amount);
  return {
    id,
    businessId: payload.businessId,
    date: payload.date,
    createdAt,
    type: payload.type,
    categoryId: payload.categoryId || null,
    amount,
    salesChannels: payload.salesChannels || [],
    note: payload.note?.trim() || "",
    noteKey: payload.noteKey || null,
    closeoutId: payload.closeoutId || null,
    outflowId: payload.outflowId || null,
    enteredBy: actor,
    attachment: payload.attachment ? makeAttachment(id, payload.attachment) : null,
    reviewed: false,
    status: "active",
    voidedAt: null,
    voidedBy: null,
    voidReason: "",
    restoredAt: null,
    restoredBy: null,
    restoreReason: "",
    auditTrail: [{ action: "created", at: createdAt, by: actor, reason: "" }],
  };
}

// ─── localStorage helpers (all no-ops in production) ─────────────────────────
function readOperationalEntries() {
  if (typeof window === "undefined") return APP_IN_PRODUCTION_MODE ? [] : createPrototypeMonthDemoOperationalEntries();
  const stored = readLocalStorageJson(OPERATIONAL_ENTRIES_STORAGE_KEY, null);
  if (!Array.isArray(stored) || stored.length === 0) {
    return APP_IN_PRODUCTION_MODE ? [] : createPrototypeMonthDemoOperationalEntries();
  }
  return stored.map((entry) => ({
    ...entry,
    auditTrail: Array.isArray(entry.auditTrail) && entry.auditTrail.length
      ? entry.auditTrail
      : [{ action: "created", at: entry.createdAt || new Date().toISOString(), by: entry.enteredBy || ownerActor, reason: "" }],
  }));
}

function readDemoLastCloseoutDates() {
  const stored = readLocalStorageJson(LAST_CLOSEOUT_STORAGE_KEY, null);
  if (stored && typeof stored === "object" && !Array.isArray(stored)) return stored;
  if (APP_IN_PRODUCTION_MODE) return {};
  return { shami: "2026-06-02", arz: "2026-06-02" };
}

function readAcknowledgedDuplicateSales() {
  if (APP_IN_PRODUCTION_MODE) return {};
  if (typeof window === "undefined") return {};
  const stored = readLocalStorageJson(ACKNOWLEDGED_DUPLICATE_SALES_STORAGE_KEY, null);
  return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
}

function readCloseoutAlerts() {
  if (APP_IN_PRODUCTION_MODE) return [];
  if (typeof window === "undefined") return [];
  const stored = readLocalStorageJson(CLOSEOUT_ALERTS_STORAGE_KEY, []);
  return Array.isArray(stored) ? stored : [];
}

function writeCloseoutAlerts(alerts) {
  if (APP_IN_PRODUCTION_MODE) return;
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLOSEOUT_ALERTS_STORAGE_KEY, JSON.stringify(alerts));
}

function openWhatsAppSupport(lang) {
  window.open(
    `https://wa.me/${PROTOTYPE_SUPPORT_WHATSAPP}?text=${encodeURIComponent(
      lang === "ar" ? "مرحبًا، أحتاج دعم تقفيلة" : "Hello, I need Taqfeelah support",
    )}`,
    "_blank",
  );
}

// ─── Prototype boot helpers (in-memory only, production returns defaults) ──

const PROTOTYPE_EMPLOYEE_PIN_DEFAULT = process.env.NEXT_PUBLIC_DEMO_EMPLOYEE_PIN_DEFAULT || (APP_IN_PRODUCTION_MODE ? "" : "1234");

const PROTOTYPE_DEFAULT_STAFF = [
  { id: "ahmed", nameAr: "أحمد", nameEn: "Ahmed", mobile: "050 123 4567", active: true, storeIds: ["shami"], pin: PROTOTYPE_EMPLOYEE_PIN_DEFAULT },
  { id: "sara", nameAr: "سارة", nameEn: "Sara", mobile: "055 987 6543", active: true, storeIds: ["arz"], pin: PROTOTYPE_EMPLOYEE_PIN_DEFAULT },
];

const DISABLE_REVIEW_ALERTS_MIGRATION_KEY = "disableReviewAlertsV1";

function migrateSavedSettings(raw) {
  if (!raw || typeof window === "undefined" || APP_IN_PRODUCTION_MODE || raw[DISABLE_REVIEW_ALERTS_MIGRATION_KEY]) return raw;
  const migrated = { ...raw, [DISABLE_REVIEW_ALERTS_MIGRATION_KEY]: true };
  if (migrated.storeOperationalSettings) {
    migrated.storeOperationalSettings = Object.fromEntries(
      Object.entries(migrated.storeOperationalSettings).map(([id, cfg]) => [
        id,
        { ...cfg, reviewEnabled: false, attachmentAlert: false, closeoutAlert: false, closeoutReviewEnabled: false },
      ]),
    );
  } else {
    migrated.reviewEnabled = false;
    migrated.closeoutAlert = false;
    migrated.attachmentAlert = false;
    migrated.closeoutReviewEnabled = false;
  }
  try {
    window.localStorage.setItem("taqfeelah_owner_settings", JSON.stringify(migrated));
  } catch { /* ignore storage errors */ }
  return migrated;
}

function readSavedSettings() {
  if (APP_IN_PRODUCTION_MODE) return null;
  if (typeof window === "undefined") return null;
  try {
    const raw = JSON.parse(window.localStorage.getItem("taqfeelah_owner_settings") || "null");
    return migrateSavedSettings(raw);
  } catch {
    return null;
  }
}

function readPrototypeAuthBoot() {
  if (APP_IN_PRODUCTION_MODE) {
    return { loggedIn: false, employee: false, loggedInEmployeeId: null, employeeBusinessId: "" };
  }
  const settings = readSavedSettings();
  return resolveAuthStateFromSession(settings?.staff || PROTOTYPE_DEFAULT_STAFF);
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

// ─── i18n helper ─────────────────────────────────────────────────────────────
const text = (lang, key) => copy[lang]?.[key] || key;

// ─── Draft helpers ────────────────────────────────────────────────────────────
function draftNeedsConfirmation(...values) {
  return values.some((value) => value && (typeof value !== "object" || Object.values(value).some(Boolean)));
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────
function Choice({ active, children, onClick }) {
  return <button onClick={onClick} className={`rounded-2xl py-3 text-xs font-extrabold ${active ? "bg-[#112A46] text-white" : "bg-white text-[#716753] ring-1 ring-black/[0.05]"}`}>{children}</button>;
}

function SmallInfo({ label, value }) {
  return <div className="rounded-2xl bg-white p-3 ring-1 ring-black/[0.05]"><p className="text-[10px] font-bold text-[#716753]">{label}</p><p className="mt-1 text-xs font-black">{value}</p></div>;
}

function ActionRow({ label, lang, danger = false, border = false }) {
  const Arrow = lang === "ar" ? ChevronLeft : ChevronRight;
  return <button className={`flex w-full items-center justify-between px-4 py-4 text-sm font-black ${border ? "border-b border-[#F0ECE2]" : ""} ${danger ? "text-[#B44747]" : "text-[#112A46]"}`}><span>{label}</span><Arrow className="h-4 w-4" /></button>;
}

function LocalAttachmentCapture({ lang, attachment, processing, error, onSelect, onClear, tall = false }) {
  return <div>
    <label className={`relative flex w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-3xl border-2 border-dashed border-[#D7CBAF] bg-[#FFFDF7] ${tall ? "h-40 flex-col" : "min-h-24 px-4 py-3"}`}>
      <input type="file" accept="image/*" capture="environment" onChange={onSelect} className="sr-only" />
      {attachment
        ? <><AttachmentPreview attachment={attachment} className="absolute inset-0 h-full w-full opacity-25" /><Check className={`${tall ? "h-8 w-8" : "h-6 w-6"} relative text-[#39A160]`} /></>
        : <Camera className={`${tall ? "h-8 w-8" : "h-6 w-6"} text-[#B99844]`} />
      }
      <div className={`relative ${tall ? "text-center" : "text-start"}`}>
        <p className="text-sm font-extrabold">{processing ? text(lang, "processingPhoto") : attachment ? text(lang, "replacePhoto") : text(lang, "cameraOrGallery")}</p>
        <p className="text-[11px] text-[#827762]">{attachment ? text(lang, "attachmentStoredLocally") : text(lang, "optional")}</p>
      </div>
    </label>
    {attachment && <button onClick={onClear} className="mt-2 text-[11px] font-bold text-[#B44747]">{text(lang, "removePhoto")}</button>}
    {error && <p className="mt-2 text-[11px] font-bold text-[#B44747]">{error}</p>}
  </div>;
}

function EmployeeStoreContext({ lang, currentStore, assignedStores, onSelect, dark = false }) {
  const [open, setOpen] = useState(false);
  const selectorRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => { if (selectorRef.current && !selectorRef.current.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);
  if (!currentStore) return <div className="mb-4 rounded-2xl bg-[#FFF1EE] p-4 text-xs font-bold text-[#B44747]">{text(lang, "noAssignedStores")}</div>;
  return (
    <div ref={selectorRef} className="relative">
      <p className={`text-[10px] font-bold ${dark ? "text-white/60" : "text-[#827762]"}`}>{text(lang, "currentWorkStore")}</p>
      <button onClick={() => assignedStores.length > 1 && setOpen(!open)} className={`mt-1 flex w-full items-center justify-between text-start ${dark ? "text-white" : "text-[#112A46]"}`}>
        <div><p className="text-sm font-black">{businessName(currentStore, lang)}</p><p className={`mt-0.5 text-[10px] font-bold ${dark ? "text-white/65" : "text-[#827762]"}`}>{businessLocation(currentStore, lang)}</p></div>
        {assignedStores.length > 1 && <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold ${dark ? "bg-white/10 text-white" : "bg-[#FFF0CB] text-[#806528]"}`}>{text(lang, "switchWorkStore")}<ChevronDown className="h-3 w-3" /></div>}
      </button>
      <AnimatePresence>
        {open && assignedStores.length > 1 && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute start-0 end-0 top-[58px] z-30 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-[#E8E1D4]">
            {assignedStores.map((business) => (
              <button key={business.id} onClick={() => { onSelect(business.id); setOpen(false); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-start ${currentStore.id === business.id ? "bg-[#FFF4D2]" : ""}`}>
                <div><p className="text-[11px] font-black text-[#112A46]">{businessName(business, lang)}</p><p className="text-[9px] font-bold text-[#827762]">{businessLocation(business, lang)}</p></div>
                {currentStore.id === business.id && <Check className="h-4 w-4 text-[#112A46]" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EntryDatePicker({ lang, value, onChange, showSuggestion = false }) {
  const [open, setOpen] = useState(false);
  const selected = new Date(`${value}T12:00:00`);
  const [calendarView, setCalendarView] = useState({ year: selected.getFullYear(), month: selected.getMonth() });
  const pickerRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => { if (pickerRef.current && !pickerRef.current.contains(event.target)) setOpen(false); };
    const closeEscape = (event) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeEscape); };
  }, [open]);
  const firstWeekday = new Date(calendarView.year, calendarView.month, 1).getDay();
  const numberOfDays = new Date(calendarView.year, calendarView.month + 1, 0).getDate();
  const dates = Array.from({ length: firstWeekday }, (_, index) => ({ key: `blank-${index}` })).concat(Array.from({ length: numberOfDays }, (_, index) => ({ key: `${index + 1}`, day: index + 1, iso: isoCalendarDate(calendarView.year, calendarView.month, index + 1) })));
  const todayLimit = todayIsoDate();
  const weekDays = lang === "ar" ? ["ح", "ن", "ث", "ر", "خ", "ج", "س"] : ["S", "M", "T", "W", "T", "F", "S"];
  const previous = () => setCalendarView((current) => current.month === 0 ? { year: current.year - 1, month: 11 } : { year: current.year, month: current.month - 1 });
  const next = () => setCalendarView((current) => current.month === 11 ? { year: current.year + 1, month: 0 } : { year: current.year, month: current.month + 1 });
  return (
    <div ref={pickerRef} className="relative mb-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-[#716753]">{text(lang, "date")}</p>
        {showSuggestion && <span className="rounded-full bg-[#FFF0CB] px-2 py-1 text-[9px] font-bold text-[#806528]">{text(lang, "suggestedNextCloseout")}</span>}
      </div>
      <button onClick={() => { setCalendarView({ year: selected.getFullYear(), month: selected.getMonth() }); setOpen(!open); }} className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3.5 text-sm font-black text-[#112A46] ring-1 ring-black/[0.05]">
        <span>{formatCalendarDate(value, lang)}</span><CalendarDays className="h-4 w-4 text-[#B99844]" />
      </button>
      {showSuggestion && <p className="mt-2 text-[10px] font-bold text-[#827762]">{text(lang, "changeDateAnytime")}</p>}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute start-0 end-0 top-[78px] z-30 rounded-2xl bg-[#FFFDF7] p-3 shadow-xl ring-1 ring-[#D8CCA8]">
            <div className="mb-3 flex items-center justify-between">
              <button onClick={previous} className="flex h-8 w-8 items-center justify-center rounded-xl text-[#806528]"><ChevronRight className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} /></button>
              <strong className="text-xs">{formatCalendarMonth(calendarView.year, calendarView.month, lang)}</strong>
              <button onClick={next} className="flex h-8 w-8 items-center justify-center rounded-xl text-[#806528]"><ChevronLeft className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} /></button>
            </div>
            <div className="mb-2 grid grid-cols-7 text-center text-[10px] font-bold text-[#957D43]">{weekDays.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold">
              {dates.map((date) => date.day
                ? <button key={date.key} disabled={date.iso > todayLimit} onClick={() => { if (date.iso <= todayLimit) { onChange(date.iso); setOpen(false); } }} className={`flex h-8 items-center justify-center rounded-lg ${date.iso > todayLimit ? "cursor-not-allowed text-[#C8C0B1]" : date.iso === value ? "bg-[#B44747] text-white" : "text-[#112A46] hover:bg-[#FFF0CB]"}`}>{date.day}</button>
                : <span key={date.key} className="h-8" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StoreOperationPicker({ lang, businessesList = [], selectedId, onSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pickerRef = useRef(null);
  const selectedStore = businessesList.find((business) => business.id === selectedId) || null;
  const searchable = businessesList.length > 2;
  const filteredStores = businessesList.filter((business) => `${businessName(business, lang)} ${businessLocation(business, lang)}`.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => { if (pickerRef.current && !pickerRef.current.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);
  if (!searchable) {
    return <div className="grid grid-cols-2 gap-2">{businessesList.map((business) => <button key={business.id} onClick={() => onSelect(business.id)} className={`rounded-2xl px-3 py-3 text-xs font-black ${selectedId === business.id ? "bg-[#112A46] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-black/[0.05]"}`}>{businessName(business, lang, true) || businessName(business, lang)}</button>)}</div>;
  }
  return (
    <div ref={pickerRef} className="relative">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-start text-xs font-black ring-1 ring-black/[0.05]">
        <span>{selectedStore ? businessName(selectedStore, lang) : text(lang, "selectStore")}</span><ChevronDown className="h-4 w-4 text-[#806528]" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute start-0 end-0 top-[50px] z-40 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-[#E8E1D4]">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text(lang, "searchStore")} className="mb-2 w-full rounded-xl bg-[#F7F5EF] px-3 py-2.5 text-[11px] font-bold outline-none" />
            <div className="max-h-48 overflow-y-auto">
              {filteredStores.map((business) => (
                <button key={business.id} onClick={() => { onSelect(business.id); setOpen(false); setQuery(""); }} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start ${selectedId === business.id ? "bg-[#FFF4D2]" : ""}`}>
                  <div><p className="text-[11px] font-black">{businessName(business, lang)}</p><p className="text-[9px] font-bold text-[#827762]">{businessLocation(business, lang)}</p></div>
                  {selectedId === business.id && <Check className="h-4 w-4 text-[#112A46]" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────
function TopBar({ lang, setLang, employee, employeeName = "", notebookMode = false, onLogout = () => {}, onEmployeeSettings = () => {}, onNotifications = () => {}, showNotifications = true, hasNotificationBadge = false }) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
  useEffect(() => {
    if (!accountMenuOpen) return undefined;
    const closeOutside = (event) => { if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) setAccountMenuOpen(false); };
    const closeEscape = (event) => { if (event.key === "Escape") setAccountMenuOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeEscape); };
  }, [accountMenuOpen]);
  return (
    <header dir="ltr" className={`taq-topbar relative z-40 h-[70px] px-5 pb-2 pt-4 ${notebookMode ? "bg-transparent" : ""}`}>
      <div className={`absolute top-[22px] flex h-10 w-10 items-center justify-center ${lang === "ar" ? "left-[14px]" : "right-[14px]"}`}>
        {!employee ? (
          showNotifications && (
            <button onClick={onNotifications} className="relative flex h-9 w-9 items-center justify-center text-[#112A46]">
              <Bell className="h-5 w-5" />
              {hasNotificationBadge && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#CE4642]" />}
            </button>
          )
        ) : (
          <LanguageSwitch lang={lang} setLang={setLang} />
        )}
      </div>
      <div className="absolute left-1/2 top-[15px] -translate-x-1/2"><Logo compact centered /></div>
      <div className={`absolute top-[22px] flex h-10 w-10 items-center justify-center ${lang === "ar" ? "right-[36px]" : "left-[36px]"}`}>
        {employee ? (
          <button onClick={onEmployeeSettings} aria-label={text(lang, "account")} className="flex h-9 w-9 items-center justify-center text-[#112A46]">
            <UserRound className="h-[21px] w-[21px]" strokeWidth={2} />
          </button>
        ) : (
          <div ref={accountMenuRef} className="relative">
            <button onClick={() => setAccountMenuOpen((open) => !open)} aria-label={text(lang, "account")} aria-expanded={accountMenuOpen} aria-haspopup="menu" className={`flex h-9 w-9 items-center justify-center rounded-full text-[#112A46] transition ${accountMenuOpen ? "text-[#9A823E]" : ""}`}>
              <UserRound className="h-[21px] w-[21px]" strokeWidth={2} />
            </button>
            <AnimatePresence>
              {accountMenuOpen && (
                <motion.div dir={lang === "ar" ? "rtl" : "ltr"} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} role="menu" className={`absolute top-[44px] z-50 w-[126px] overflow-hidden rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-black/[0.06] ${lang === "ar" ? "right-0" : "left-0"}`}>
                  <div className="flex justify-center px-1 py-1.5"><LanguageSwitch lang={lang} setLang={setLang} /></div>
                  <div className="my-1 border-t border-[#F0ECE2]" />
                  <button role="menuitem" onClick={() => { setAccountMenuOpen(false); onLogout(); }} className="flex w-full items-center justify-center rounded-lg px-2 py-2.5 text-[10px] font-black text-[#B44747] transition hover:bg-[#FFF1EE]">
                    <span>{text(lang, "logout")}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
}

// ─── OwnerSummaryScreen ───────────────────────────────────────────────────────
function OwnerSummaryScreen({ lang, onBack, onSave, saving = false, selectedBusiness, businessesList = [], storeChannelSettings = {} }) {
  const [businessId, setBusinessId] = useState(selectedBusiness === "all" ? "" : selectedBusiness);
  const [summaryDate, setSummaryDate] = useState(() => todayIsoDate());
  const { attachment, processing, error, selectAttachment, clearAttachment } = useAttachmentCapture(lang);
  const selectedStore = businessesList.find((business) => business.id === businessId) || null;
  const channelConfig = getStoreChannelConfig(storeChannelSettings, businessId);
  const salesChannels = selectedStore ? channelConfig.channels.filter((channel) => channelConfig.activeIds.includes(channel.id) && !channel.retired) : [];
  const [values, setValues] = useState({});
  const channelSignature = salesChannels.map((channel) => channel.id).join("|");
  useEffect(() => { setValues(Object.fromEntries(salesChannels.map((channel) => [channel.id, ""]))); clearAttachment(); }, [businessId, channelSignature]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = useMemo(() => salesChannels.reduce((sum, channel) => sum + toAmount(values[channel.id]), 0), [salesChannels, values]);
  const canSave = Boolean(selectedStore && salesChannels.length > 0 && total > 0 && summaryDate <= todayIsoDate());
  const changeStore = (nextBusinessId) => {
    if (nextBusinessId !== businessId && draftNeedsConfirmation(values, attachment) && !window.confirm(text(lang, "discardDraftOnStoreChange"))) return;
    setBusinessId(nextBusinessId);
  };
  const submit = () => canSave && !processing && !saving && onSave({ date: summaryDate, businessId, type: "summary", salesChannels: salesChannels.map((channel) => ({ channelId: channel.id, name: channelName(channel, lang), amount: toAmount(values[channel.id]) })).filter((row) => row.amount > 0), attachment, noteKey: "salesSummary" });
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto w-full pb-24 sm:max-w-[560px] lg:max-w-none">
      <BackTitle lang={lang} title={text(lang, "dailySummary")} onBack={onBack} />
      <div className="space-y-5 px-5">
        <EntryDatePicker lang={lang} value={summaryDate} onChange={setSummaryDate} />
        <div>
          <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "operationStore")}</p>
          <StoreOperationPicker lang={lang} businessesList={businessesList} selectedId={businessId} onSelect={changeStore} />
          <p className={`mt-2 text-[10px] font-bold ${selectedStore ? "text-[#827762]" : "text-[#B44747]"}`}>{selectedStore ? text(lang, "operationStoreHint") : text(lang, "chooseStoreForSummary")}</p>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold text-[#716753]">{text(lang, "salesChannels")}</p>
          {!selectedStore
            ? <div className="rounded-3xl bg-white p-5 text-xs font-bold text-[#827762] ring-1 ring-black/[0.05]">{text(lang, "chooseStoreForSummary")}</div>
            : salesChannels.length === 0
              ? <div className="rounded-3xl bg-white p-5 text-xs font-bold text-[#B44747] ring-1 ring-black/[0.05]">{text(lang, "noSalesChannels")}</div>
              : <div className="grid grid-cols-3 gap-2">{salesChannels.map((channel) => <label key={channel.id} className="rounded-2xl bg-white px-2 py-3 text-center ring-1 ring-black/[0.05]"><span className="mb-2 block min-h-[30px] text-[11px] font-bold leading-4 text-[#716753]">{channelName(channel, lang)}</span><div dir="ltr" className="flex items-center justify-center gap-1"><input inputMode="decimal" value={values[channel.id] || ""} onChange={(event) => setValues((current) => ({ ...current, [channel.id]: sanitizeAmountInput(event.target.value) }))} className="min-w-0 w-full bg-[#F7F5EF] px-1 py-2 text-center text-sm font-black outline-none" /><span className="text-[9px] font-bold text-[#827762]">{lang === "ar" ? "ر.س" : "SAR"}</span></div></label>)}</div>
          }
        </div>
        <div className="flex justify-between rounded-3xl bg-[#112A46] p-5 text-white">
          <span className="text-sm font-bold text-white/70">{text(lang, "totalSales")}</span>
          <strong><MoneyValue value={money(total, lang)} /></strong>
        </div>
        <LocalAttachmentCapture lang={lang} attachment={attachment} processing={processing} error={error} onSelect={selectAttachment} onClear={clearAttachment} />
        <button disabled={!canSave || processing || saving} onClick={submit} className={`w-full rounded-2xl py-4 text-sm font-extrabold text-white ${canSave && !processing && !saving ? "bg-[#39A160]" : "bg-[#B8C0B7]"}`}>{text(lang, saving ? "saving" : "save")}</button>
      </div>
    </motion.section>
  );
}

// ─── OwnerExpenseScreen ───────────────────────────────────────────────────────
function OwnerExpenseScreen({ lang, onBack, onSave, saving = false, selectedBusiness, businessesList = [], storeOperationalSettings = {} }) {
  const [businessId, setBusinessId] = useState(selectedBusiness === "all" ? "" : selectedBusiness);
  const [kind, setKind] = useState("expense");
  const [category, setCategory] = useState("other");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [operationDate, setOperationDate] = useState(() => todayIsoDate());
  const { attachment, processing, error, selectAttachment, clearAttachment } = useAttachmentCapture(lang);
  const selectedStore = businessesList.find((business) => business.id === businessId);
  const activeCategories = expenseCategories.filter((item) => getStoreOperationalConfig(storeOperationalSettings, businessId).activeCategories.includes(item.id));
  useEffect(() => { if (!activeCategories.some((item) => item.id === category)) setCategory(activeCategories[0]?.id || "other"); }, [businessId, category]); // eslint-disable-line react-hooks/exhaustive-deps
  const canSave = Boolean(selectedStore && toAmount(amount) > 0 && (kind !== "expense" || activeCategories.length > 0));
  const changeStore = (nextBusinessId) => {
    if (nextBusinessId !== businessId && draftNeedsConfirmation(amount, note, attachment) && !window.confirm(text(lang, "discardDraftOnStoreChange"))) return;
    if (nextBusinessId !== businessId) { setAmount(""); setNote(""); clearAttachment(); }
    setBusinessId(nextBusinessId);
  };
  const categoryLabel = kind === "expense" ? text(lang, activeCategories.find((item) => item.id === category)?.label || "other") : text(lang, kind);
  const submit = () => canSave && !processing && !saving && onSave({ date: operationDate, businessId, type: kind, categoryId: kind === "expense" ? category : kind, amount: toAmount(amount), note, attachment });
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto w-full pb-24 sm:max-w-[560px] lg:max-w-none">
      <BackTitle lang={lang} title={text(lang, "addOutflow")} onBack={onBack} />
      <div className="space-y-5 px-5">
        <div className="rounded-2xl bg-[#FFF4D2] p-3 text-[11px] font-bold leading-5 text-[#806528]">{text(lang, "ownerOutflowNotice")}</div>
        <EntryDatePicker lang={lang} value={operationDate} onChange={setOperationDate} />
        <div>
          <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "operationStore")}</p>
          <StoreOperationPicker lang={lang} businessesList={businessesList} selectedId={businessId} onSelect={changeStore} />
          <p className={`mt-2 text-[10px] font-bold ${selectedStore ? "text-[#827762]" : "text-[#B44747]"}`}>{selectedStore ? text(lang, "operationStoreHint") : text(lang, "chooseOperationStore")}</p>
        </div>
        <div>
          <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "transactionType")}</p>
          <div className="grid grid-cols-3 gap-2">{["expense", "purchases", "withdrawal"].map((item) => <Choice key={item} active={kind === item} onClick={() => setKind(item)}>{text(lang, item)}</Choice>)}</div>
        </div>
        {kind === "expense" && (
          <div>
            <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "category")}</p>
            {activeCategories.length
              ? <div className="grid grid-cols-3 gap-2">{activeCategories.map((item) => <Choice key={item.id} active={category === item.id} onClick={() => setCategory(item.id)}>{text(lang, item.label)}</Choice>)}</div>
              : <p className="rounded-xl bg-[#FFF1EE] p-3 text-[10px] font-bold text-[#B44747]">{text(lang, "atLeastOneCategory")}</p>
            }
          </div>
        )}
        <div className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.05]">
          <p className="text-xs font-bold text-[#716753]">{text(lang, "amount")}</p>
          <div className="mt-2 flex items-center gap-2" dir="ltr">
            <input inputMode="decimal" value={amount} onChange={(event) => setAmount(sanitizeAmountInput(event.target.value))} placeholder="0" className="w-full min-w-0 bg-transparent text-4xl font-black outline-none" />
            <span className="mt-3 text-sm font-bold text-[#786D58]">{lang === "ar" ? "ر.س" : "SAR"}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SmallInfo label={text(lang, "date")} value={formatCalendarDate(operationDate, lang)} />
          <SmallInfo label={text(lang, "category")} value={categoryLabel} />
        </div>
        <div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.05]">
          <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "note")} <span className="font-normal">({text(lang, "optional")})</span></p>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={text(lang, "notePlaceholder")} className="min-h-[52px] w-full resize-none rounded-2xl bg-[#F7F5EF] px-4 py-3 text-sm outline-none" />
        </div>
        <LocalAttachmentCapture lang={lang} attachment={attachment} processing={processing} error={error} onSelect={selectAttachment} onClear={clearAttachment} />
        <button disabled={!canSave || processing || saving} onClick={submit} className={`w-full rounded-2xl py-4 text-sm font-extrabold text-white transition ${canSave && !processing && !saving ? "bg-[#112A46]" : "cursor-not-allowed bg-[#B8C0B7]"}`}>{text(lang, saving ? "saving" : "saveOutflow")}</button>
      </div>
    </motion.section>
  );
}

// ─── EmployeeSettingsScreen ───────────────────────────────────────────────────
function EmployeeSettingsScreen({ lang, onBack, currentStore, assignedStores = [], onSelectStore, employeeNotebookTheme, setEmployeeNotebookTheme, onOpenSupport, onOpenHelp }) {
  const perms = ["permissionSummary", "permissionOutflow", "permissionAttach"];
  const BackIcon = lang === "ar" ? ChevronRight : ChevronLeft;
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-24">
      {onBack && (
        <div className="mb-5 flex items-center gap-3">
          <button onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04]"><BackIcon className="h-5 w-5" /></button>
          <h2 className="text-xl font-black">{text(lang, "settings")}</h2>
        </div>
      )}
      <div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
        <EmployeeStoreContext lang={lang} currentStore={currentStore} assignedStores={assignedStores} onSelect={onSelectStore} />
      </div>
      {employeeNotebookTheme && setEmployeeNotebookTheme && (
        <div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
          <p className="mb-3 text-xs font-bold text-[#716753]">{lang === "ar" ? "سمة الدفتر" : "Notebook Theme"}</p>
          <ThemePicker lang={lang} theme={employeeNotebookTheme} onChange={setEmployeeNotebookTheme} />
        </div>
      )}
      <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "permissions")}</p>
      <div className="mb-5 rounded-3xl bg-white p-4 ring-1 ring-black/[0.045]">
        <p className="mb-4 text-[11px] font-bold text-[#806528]">{text(lang, "employeeEntryOnly")}</p>
        {perms.map((key) => <div key={key} className="mb-3 flex items-center gap-2 last:mb-0"><Check className="h-4 w-4 text-[#39A160]" /><span className="text-xs font-bold">{text(lang, key)}</span></div>)}
        <p className="mt-4 border-t border-[#F0ECE2] pt-3 text-[11px] font-bold text-[#827762]">{text(lang, "ownerOnly")}</p>
      </div>
      <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
        {onOpenSupport && <ActionRow label={text(lang, "support")} lang={lang} border />}
        {onOpenHelp && <ActionRow label={lang === "ar" ? "مركز المساعدة" : "Help Center"} lang={lang} border />}
      </div>
    </motion.section>
  );
}

// ─── HelpCenterSheet ──────────────────────────────────────────────────────────
function HelpCenterSheet({ lang, open, onClose }) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        className="relative z-10 w-full max-w-lg rounded-t-3xl bg-white px-6 pb-10 pt-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#D9D3C7]" />
        <h2 className="mb-1 text-lg font-black">{lang === "ar" ? "مركز المساعدة" : "Help Center"}</h2>
        <p className="mb-5 text-xs font-bold text-[#827762]">{lang === "ar" ? "للتواصل مع الدعم الفني" : "Contact technical support"}</p>
        <a
          href={`https://wa.me/966501234567`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-4 text-sm font-extrabold text-white"
        >
          {lang === "ar" ? "تواصل عبر واتساب" : "Chat on WhatsApp"}
        </a>
        <button onClick={onClose} className="mt-3 w-full rounded-2xl bg-[#F7F5EF] py-3 text-sm font-bold text-[#716753]">{lang === "ar" ? "إغلاق" : "Close"}</button>
      </motion.div>
    </div>,
    document.body
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
          <div className="taq-scroll relative min-h-0 overflow-y-auto overscroll-y-contain">{employee && !activeEmployee && <section className="px-5 pb-24"><div className="rounded-3xl bg-white p-8 text-center text-sm font-bold text-[#827762] ring-1 ring-black/[0.045]">{runtimeSettingsHydratedRef.current ? text(lang, "noActiveEmployee") : (lang === "ar" ? "جاري تحميل بيانات الموظف..." : "Loading employee data...")}</div></section>}{employee && activeEmployee && employeePage === "closeouts" && <EmployeeCloseoutsView lang={lang} employee={activeEmployee} currentStore={currentEmployeeBusiness} assignedStores={assignedEmployeeBusinesses} onSelectStore={setEmployeeBusinessId} salesChannels={currentEmployeeChannelConfig.channels.filter((channel) => currentEmployeeChannelConfig.activeIds.includes(channel.id) && !channel.retired).map((channel) => ({ ...channel, displayName: channelName(channel, lang) }))} notebookTheme={employeeNotebookTheme} reviewWorkflowEnabled={closeoutReviewEnabledForBusiness(currentEmployeeBusiness?.id)} employeeHistoryVisibility={currentEmployeeOperationalConfig.employeeHistoryVisibility || "all"} formatCalendarDate={formatCalendarDate} channelLabel={(channel) => channel.displayName || channelName(channel, lang)} settingsPanel={({ onBack }) => <EmployeeSettingsScreen lang={lang} onBack={onBack} currentStore={currentEmployeeBusiness} assignedStores={assignedEmployeeBusinesses} onSelectStore={setEmployeeBusinessId} employeeNotebookTheme={employeeThemeOverride || readEmployeeNotebookTheme(activeEmployee.id) || employeeNotebookTheme} setEmployeeNotebookTheme={(theme) => { writeEmployeeNotebookTheme(activeEmployee.id, theme); setEmployeeThemeOverride(theme); }} onOpenSupport={() => openWhatsAppSupport(lang)} onOpenHelp={() => setHelpOpen(true)} />} onEntryActiveChange={setEmployeeEntryActive} onRegisterAdd={(handler) => { employeeAddHandlerRef.current = handler || (() => {}); }} onRegisterSettingsOpener={(handler) => { employeeSettingsOpenerRef.current = handler || (() => {}); }} saving={saving} />}{!employee && ownerPage === "home" && <NotebookScrollSurface theme={notebookTheme} lang={lang}><OwnerHomeConnected lang={lang} operationalEntries={operationalEntries} duplicateSalesAlerts={duplicateSalesAlerts} closeoutAlerts={unseenCloseoutAlerts} closeoutReviewEnabledForBusiness={closeoutReviewEnabledForBusiness} onViewPendingCloseouts={(closeout) => { setOwnerReviewCloseout(closeout); setSelectedBusiness(closeout.storeId); }} onReviewCloseout={reviewCloseoutAlert} onDismissCloseout={dismissCloseoutAlert} onReviewDuplicate={reviewDuplicateSales} onAcknowledgeDuplicate={acknowledgeDuplicateSales} reviewEnabledForBusiness={reviewEnabledForBusiness} onOpenOperation={handleOpenOwnerOperation} onShareNotebook={setShareSnapshot} notebookTheme={notebookTheme} selectedBusiness={activeViewBusiness} setSelectedBusiness={setSelectedBusiness} reviewEnabled={ownerReviewEnabled} businessesList={activeBusinesses} /></NotebookScrollSurface>}{!employee && ownerPage === "add-summary" && <OwnerSummaryScreen lang={lang} saving={saving} selectedBusiness={activeViewBusiness} businessesList={activeBusinesses} storeChannelSettings={storeChannelSettings} onBack={() => setOwnerPage("home")} onSave={saveOwnerSummary} />}{!employee && ownerPage === "add-expense" && <OwnerExpenseScreen lang={lang} saving={saving} selectedBusiness={activeViewBusiness} businessesList={activeBusinesses} storeOperationalSettings={storeOperationalSettings} onBack={() => setOwnerPage("home")} onSave={saveOwner} />}{!employee && ownerPage === "reports" && <NotebookScrollSurface theme={notebookTheme} lang={lang}><ReportsScreen lang={lang} operationalEntries={operationalEntries} archivedReadOnlyBusinessId={archivedReadOnlyBusinessId} reviewEnabledForBusiness={reviewEnabledForBusiness} onShareNotebook={setShareSnapshot} notebookTheme={notebookTheme} setNotebookTheme={setNotebookTheme} selectedBusiness={selectedBusiness} setSelectedBusiness={setSelectedBusiness} configuredChannels={reportChannelConfig.channels} reviewEnabled={ownerReviewEnabled} businessesList={reportingBusinesses} archivedBusinessIds={archivedBusinessIds} /></NotebookScrollSurface>}{!employee && ownerPage === "register" && <OwnerRegisterConnected lang={lang} onOpenOperation={handleOpenOwnerOperation} reviewFocus={duplicateReviewFocus} attachmentReviewRequest={attachmentReviewRequest} archivedReadOnlyBusinessId={archivedReadOnlyBusinessId} operationalEntries={operationalEntries} selectedBusiness={selectedBusiness} setSelectedBusiness={setSelectedBusiness} businessesList={reportingBusinesses} archivedBusinessIds={archivedBusinessIds} notebookTheme={notebookTheme} />}{!employee && ownerPage === "ledger" && <OwnerLedgerConnected lang={lang} operationalEntries={operationalEntries} businessesList={reportingBusinesses} archivedBusinessIds={archivedBusinessIds} storeChannelSettings={storeChannelSettings} reviewEnabledForBusiness={reviewEnabledForBusiness} onOpenOperation={handleOpenOwnerOperation} onReviewCloseout={reviewCloseoutAlert} onReturnCloseout={(closeout) => { setOwnerReviewCloseout(null); }} notebookTheme={notebookTheme} onBack={() => setOwnerPage("home")} />}{!employee && ownerPage === "settings" && <OwnerSettingsScreen lang={lang} operationalEntries={operationalEntries} selectedBusiness={selectedBusiness} setSelectedBusiness={setSelectedBusiness} setOwnerPage={setOwnerPage} setArchivedReadOnlyBusinessId={setArchivedReadOnlyBusinessId} setLastCloseoutDates={setLastCloseoutDates} notebookTheme={notebookTheme} setNotebookTheme={setNotebookTheme} storeChannelSettings={storeChannelSettings} setStoreChannelSettings={setStoreChannelSettings} storeOperationalSettings={storeOperationalSettings} setStoreOperationalSettings={setStoreOperationalSettings} configuredBusinesses={configuredBusinesses} setConfiguredBusinesses={setConfiguredBusinesses} archivedBusinessIds={archivedBusinessIds} setArchivedBusinessIds={setArchivedBusinessIds} staff={staff} setStaff={setStaff} ownerProfile={ownerProfile} setOwnerProfile={setOwnerProfile} authOwnerUsername={authOwnerUsername} setAuthOwnerUsername={setAuthOwnerUsername} authOwnerPassword={authOwnerPassword} setAuthOwnerPassword={setAuthOwnerPassword} authEmployeePins={authEmployeePins} setAuthEmployeePins={setAuthEmployeePins} onPersistSettingsNow={persistRuntimeSettingsNow} onLogout={logout} onOpenSupport={() => openWhatsAppSupport(lang)} onOpenHelp={() => setHelpOpen(true)} />}{saved && <div className="sticky bottom-4 left-4 right-4 z-30 mx-auto max-w-md rounded-2xl bg-[#112A46] p-4 text-xs font-bold text-white">{text(lang, "savedNotice")}</div>}
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

