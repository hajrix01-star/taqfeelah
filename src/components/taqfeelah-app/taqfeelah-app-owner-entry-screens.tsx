"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { getStoreOperationalConfig } from "@/features/org-config/client/store-operational-config";
import {
  ProofAddButton,
  ProofAttachmentPreview,
  useAttachmentCapture,
} from "./taqfeelah-app-attachment-ui";
import { BackTitle } from "./taqfeelah-app-chrome";
import {
  draftNeedsConfirmation,
  sanitizeAmountInput,
  toAmount,
} from "./taqfeelah-app-entry-form-utils";
import {
  businesses,
  businessLocation,
  businessName,
  channelName,
  expenseCategories,
  money,
  resolveStoreChannelConfig,
  text,
} from "./taqfeelah-app-demo-data";
import { formatCalendarDate } from "@/features/reports/client/report-period-labels";
import { formatCalendarMonth,
  isoCalendarDate,
  MoneyValue,
  todayIsoDate,
} from "./taqfeelah-app-notebook";
import { resolveAttachmentPreviewSrc } from "@/features/employee-closeouts/daily-closeout-entry-helpers";
import { appConfirm } from "@/lib/ui/app-dialog/app-dialog-bridge";
import type { PrototypeBusiness, PrototypeLang } from "./taqfeelah-app-types";
import type { ReactNode } from "react";

function EntryDatePicker({ lang, value, onChange, showSuggestion = false }: {
  lang: PrototypeLang;
  value: string;
  onChange: (value: string) => void;
  showSuggestion?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = new Date(`${value}T12:00:00`);
  const [calendarView, setCalendarView] = useState({ year: selected.getFullYear(), month: selected.getMonth() });
  const pickerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event: PointerEvent) => { if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) setOpen(false); };
    const closeEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeEscape); };
  }, [open]);
  const firstWeekday = new Date(calendarView.year, calendarView.month, 1).getDay();
  const numberOfDays = new Date(calendarView.year, calendarView.month + 1, 0).getDate();
  const dates: Array<{ key: string; day?: number; iso?: string }> = Array.from({ length: firstWeekday }, (_, index) => ({ key: `blank-${index}` })).concat(Array.from({ length: numberOfDays }, (_, index) => ({ key: `${index + 1}`, day: index + 1, iso: isoCalendarDate(calendarView.year, calendarView.month, index + 1) })));
  const todayLimit = todayIsoDate();
  const weekDays = lang === "ar" ? ["ح", "ن", "ث", "ر", "خ", "ج", "س"] : ["S", "M", "T", "W", "T", "F", "S"];
  const previous = () => setCalendarView((current) => current.month === 0 ? { year: current.year - 1, month: 11 } : { year: current.year, month: current.month - 1 });
  const next = () => setCalendarView((current) => current.month === 11 ? { year: current.year + 1, month: 0 } : { year: current.year, month: current.month + 1 });
  return (
    <div ref={pickerRef} className="relative mb-5">
      <div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs font-bold text-[#716753]">{text(lang, "date")}</p>{showSuggestion && <span className="rounded-full bg-[#FFF0CB] px-2 py-1 text-taq-nav font-bold text-[#806528]">{text(lang, "suggestedNextCloseout")}</span>}</div>
      <button type="button" onClick={() => { setCalendarView({ year: selected.getFullYear(), month: selected.getMonth() }); setOpen(!open); }} className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3.5 text-sm font-black text-[#112A46] ring-1 ring-black/[0.05]">
        <span>{formatCalendarDate(value, lang)}</span><CalendarDays className="h-4 w-4 text-[#B99844]" />
      </button>
      {showSuggestion && <p className="mt-2 text-taq-meta font-bold text-[#827762]">{text(lang, "changeDateAnytime")}</p>}
      <AnimatePresence>{open && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute start-0 end-0 top-[78px] z-30 rounded-2xl bg-[#FFFDF7] p-3 shadow-xl ring-1 ring-[#D8CCA8]">
        <div className="mb-3 flex items-center justify-between"><button type="button" onClick={previous} className="flex h-8 w-8 items-center justify-center rounded-xl text-[#806528]"><ChevronRight className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} /></button><strong className="text-xs">{formatCalendarMonth(calendarView.year, calendarView.month, lang)}</strong><button type="button" onClick={next} className="flex h-8 w-8 items-center justify-center rounded-xl text-[#806528]"><ChevronLeft className={`h-4 w-4 ${lang === "en" ? "rotate-180" : ""}`} /></button></div>
        <div className="mb-2 grid grid-cols-7 text-center text-taq-meta font-bold text-[#957D43]">{weekDays.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold">{dates.map((date) => date.day ? <button key={date.key} type="button" disabled={Boolean(date.iso && date.iso > todayLimit)} onClick={() => { if (date.iso && date.iso <= todayLimit) { onChange(date.iso); setOpen(false); } }} className={`flex h-8 items-center justify-center rounded-lg ${date.iso && date.iso > todayLimit ? "cursor-not-allowed text-[#C8C0B1]" : date.iso === value ? "bg-[#B44747] text-white" : "text-[#112A46] hover:bg-[#FFF0CB]"}`}>{date.day}</button> : <span key={date.key} className="h-8" />)}</div>
      </motion.div>}</AnimatePresence>
    </div>
  );
}

function Choice({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`rounded-2xl py-3 text-xs font-extrabold ${active ? "bg-[#112A46] text-white" : "bg-white text-[#716753] ring-1 ring-black/[0.05]"}`}>{children}</button>;
}

function SmallInfo({ label, value }: { label: ReactNode; value: ReactNode }) {
  return <div className="rounded-2xl bg-white p-3 ring-1 ring-black/[0.05]"><p className="text-taq-meta font-bold text-[#716753]">{label}</p><p className="mt-1 text-xs font-black">{value}</p></div>;
}

function StoreOperationPicker({ lang, businessesList = businesses, selectedId, onSelect }: {
  lang: PrototypeLang;
  businessesList?: PrototypeBusiness[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const selectedStore = businessesList.find((business) => business.id === selectedId) || null;
  const searchable = businessesList.length > 2;
  const filteredStores = businessesList.filter((business) => `${businessName(business, lang)} ${businessLocation(business, lang)}`.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event: PointerEvent) => { if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);
  if (!searchable) {
    return <div className="grid grid-cols-2 gap-2">{businessesList.map((business) => <button key={business.id} type="button" onClick={() => onSelect(business.id)} className={`rounded-2xl px-3 py-3 text-xs font-black ${selectedId === business.id ? "bg-[#112A46] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-black/[0.05]"}`}>{businessName(business, lang, true) || businessName(business, lang)}</button>)}</div>;
  }
  return (
    <div ref={pickerRef} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-start text-xs font-black ring-1 ring-black/[0.05]"><span>{selectedStore ? businessName(selectedStore, lang) : text(lang, "selectStore")}</span><ChevronDown className="h-4 w-4 text-[#806528]" /></button>
      <AnimatePresence>{open && <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute start-0 end-0 top-[50px] z-40 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-[#E8E1D4]"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text(lang, "searchStore")} className="mb-2 w-full rounded-xl bg-[#F7F5EF] px-3 py-2.5 text-taq-meta font-bold outline-none" /><div className="max-h-48 overflow-y-auto">{filteredStores.map((business) => <button key={business.id} type="button" onClick={() => { onSelect(business.id); setOpen(false); setQuery(""); }} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start ${selectedId === business.id ? "bg-[#FFF4D2]" : ""}`}><div><p className="text-taq-meta font-black">{businessName(business, lang)}</p><p className="text-taq-nav font-bold text-[#827762]">{businessLocation(business, lang)}</p></div>{selectedId === business.id && <Check className="h-4 w-4 text-[#112A46]" />}</button>)}</div></motion.div>}</AnimatePresence>
    </div>
  );
}

export function OwnerSummaryScreen({
  lang,
  onBack,
  onSave,
  saving = false,
  selectedBusiness,
  businessesList = businesses,
  storeChannelSettings = {},
}: {
  lang: PrototypeLang;
  onBack: () => void;
  onSave: (payload: import("@/features/entries/client/entries-client-types").OperationalEntryPayload) => void;
  saving?: boolean;
  selectedBusiness: string;
  businessesList?: import("./taqfeelah-app-types").PrototypeBusiness[];
  storeChannelSettings?: import("./taqfeelah-app-types").PrototypeStoreChannelSettings;
}) {
  const [businessId, setBusinessId] = useState(() => {
    if (businessesList.length === 1) return businessesList[0].id;
    return selectedBusiness === "all" ? "" : selectedBusiness;
  });
  const [summaryDate, setSummaryDate] = useState(() => todayIsoDate());
  const { attachment, processing, error, selectAttachment, clearAttachment } = useAttachmentCapture(lang);
  const selectedStore = useMemo(
    () => businessesList.find((business) => business.id === businessId) || null,
    [businessId, businessesList],
  );
  const salesChannels = useMemo(() => {
    if (!selectedStore) return [];
    const channelConfig = resolveStoreChannelConfig(storeChannelSettings, businessId);
    return channelConfig.channels.filter(
      (channel) => channelConfig.activeIds.includes(String(channel.id)) && !channel.retired,
    );
  }, [businessId, selectedStore, storeChannelSettings]);
  const [values, setValues] = useState<Record<string, string>>({});
  const channelSignature = salesChannels.map((channel) => String(channel.id)).join("|");
  useEffect(() => {
    setValues(Object.fromEntries(salesChannels.map((channel) => [channel.id, ""])));
    clearAttachment();
  // channelSignature captures salesChannels identity; omit unstable array/callback refs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, channelSignature]);
  const total = useMemo(() => salesChannels.reduce((sum, channel) => sum + toAmount(values[String(channel.id)]), 0), [salesChannels, values]);
  const canSave = Boolean(selectedStore && salesChannels.length > 0 && total > 0 && summaryDate <= todayIsoDate());
  const formEnabled = Boolean(selectedStore);
  const showStorePicker = businessesList.length > 1;
  const changeStore = async (nextBusinessId: string) => {
    if (nextBusinessId !== businessId && draftNeedsConfirmation(values, attachment) && !(await appConfirm({ lang, title: text(lang, "discardDraftOnStoreChange"), confirmLabel: text(lang, "dialogOk"), cancelLabel: text(lang, "cancel"), variant: "warning" }))) return;
    setBusinessId(nextBusinessId);
  };
  const submit = () => canSave && !processing && !saving && onSave({
    date: summaryDate,
    businessId,
    type: "summary",
    salesChannels: salesChannels.map((channel) => ({
      channelId: String(channel.id),
      name: channelName(channel, lang),
      amount: toAmount(values[String(channel.id)]),
    })).filter((row) => row.amount > 0),
    attachment,
    noteKey: "salesSummary",
  });
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto w-full pb-24 sm:max-w-[560px] lg:max-w-none">
      <BackTitle lang={lang} title={text(lang, "dailySummary")} onBack={onBack} />
      <div className="space-y-5 taq-page-gutter">
        {showStorePicker ? (
          <div>
            <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "operationStore")}</p>
            <StoreOperationPicker lang={lang} businessesList={businessesList} selectedId={businessId} onSelect={changeStore} />
            <p className={`mt-2 text-taq-meta font-bold ${selectedStore ? "text-[#827762]" : "text-[#B44747]"}`}>
              {!selectedStore ? text(lang, "chooseStoreToStartEntry") : null}
            </p>
          </div>
        ) : null}
        <fieldset disabled={!formEnabled} className="min-w-0 space-y-5 border-0 p-0 m-0 disabled:opacity-55">
        <EntryDatePicker lang={lang} value={summaryDate} onChange={setSummaryDate} />
        {!showStorePicker ? (
          <div>
            <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "operationStore")}</p>
            <StoreOperationPicker lang={lang} businessesList={businessesList} selectedId={businessId} onSelect={changeStore} />
            <p className={`mt-2 text-taq-meta font-bold ${selectedStore ? "text-[#827762]" : "text-[#B44747]"}`}>{!selectedStore ? text(lang, "chooseStoreForSummary") : null}</p>
          </div>
        ) : null}
        <div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.05]">
          <p className="mb-3 text-xs font-bold text-[#716753]">{text(lang, "salesChannels")}</p>
          {salesChannels.length === 0 ? <div className="rounded-2xl bg-[#FFF1EE] p-5 text-xs font-bold text-[#B44747]">{text(lang, "noSalesChannels")}</div> : <div className="grid grid-cols-3 gap-2">{salesChannels.map((channel) => <label key={String(channel.id)} className="rounded-2xl bg-[#F7F5EF] px-2 py-3 text-center ring-1 ring-black/[0.05]"><span className="mb-2 block min-h-[30px] text-taq-meta font-bold leading-4 text-[#716753]">{channelName(channel, lang)}</span><div dir="ltr" className="flex items-center justify-center gap-1"><input inputMode="decimal" value={values[String(channel.id)] || ""} onChange={(event) => setValues((current) => ({ ...current, [String(channel.id)]: sanitizeAmountInput(event.target.value) }))} className="min-w-0 w-full bg-white px-1 py-2 text-center text-sm font-black outline-none" /><span className="text-taq-nav font-bold text-[#827762]">{lang === "ar" ? "ر.س" : "SAR"}</span></div></label>)}</div>}
          <div className="mt-4 rounded-2xl bg-[#112A46] p-4 text-white">
            <div className="flex items-center justify-between"><span className="text-sm font-bold text-white/70">{text(lang, "totalSales")}</span><strong><MoneyValue value={money(total, lang)} /></strong></div>
            {total > 0 ? (
              <div className="mt-3 border-t border-white/15 pt-3">
                <p className="text-taq-nav font-bold text-white/75">{text(lang, "salesSummaryPhoto")} ({text(lang, "optional")})</p>
                {!resolveAttachmentPreviewSrc(attachment) ? (
                  <ProofAddButton lang={lang} onSelect={selectAttachment} disabled={processing} processing={processing} className="mt-2" />
                ) : null}
                {error ? <p className="mt-2 text-taq-nav font-black text-[#FFB4B4]">{error}</p> : null}
                <ProofAttachmentPreview
                  lang={lang}
                  src={resolveAttachmentPreviewSrc(attachment)}
                  onRemove={clearAttachment}
                />
              </div>
            ) : null}
          </div>
        </div>
        <button type="button" disabled={!canSave || processing || saving} onClick={submit} className={`w-full rounded-2xl py-4 text-sm font-extrabold text-white ${canSave && !processing && !saving ? "bg-[#39A160]" : "bg-[#B8C0B7]"}`}>{text(lang, saving ? "saving" : "save")}</button>
        </fieldset>
      </div>
    </motion.section>
  );
}

export function OwnerExpenseScreen({
  lang,
  onBack,
  onSave,
  saving = false,
  selectedBusiness,
  businessesList = businesses,
  storeOperationalSettings = {},
}: {
  lang: PrototypeLang;
  onBack: () => void;
  onSave: (payload: import("@/features/entries/client/entries-client-types").OperationalEntryPayload) => void;
  saving?: boolean;
  selectedBusiness: string;
  businessesList?: import("./taqfeelah-app-types").PrototypeBusiness[];
  storeOperationalSettings?: import("./taqfeelah-app-types").PrototypeStoreOperationalSettings;
}) {
  const [businessId, setBusinessId] = useState(() => {
    if (businessesList.length === 1) return businessesList[0].id;
    return selectedBusiness === "all" ? "" : selectedBusiness;
  });
  const [kind, setKind] = useState("expense");
  const [category, setCategory] = useState("other");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [operationDate, setOperationDate] = useState(() => todayIsoDate());
  const { attachment, processing, error, selectAttachment, clearAttachment } = useAttachmentCapture(lang);
  const selectedStore = businessesList.find((business) => business.id === businessId);
  const activeCategories = expenseCategories.filter((item) => getStoreOperationalConfig(storeOperationalSettings, businessId).activeCategories.includes(item.id));
  const activeCategoryIds = activeCategories.map((item) => item.id).join("|");
  useEffect(() => {
    if (!activeCategories.some((item) => item.id === category)) {
      setCategory(activeCategories[0]?.id || "other");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, category, activeCategoryIds]);
  const canSave = Boolean(selectedStore && toAmount(amount) > 0 && (kind !== "expense" || activeCategories.length > 0));
  const formEnabled = Boolean(selectedStore);
  const showStorePicker = businessesList.length > 1;
  const changeStore = async (nextBusinessId: string) => {
    if (nextBusinessId !== businessId && draftNeedsConfirmation(amount, note, attachment) && !(await appConfirm({ lang, title: text(lang, "discardDraftOnStoreChange"), confirmLabel: text(lang, "dialogOk"), cancelLabel: text(lang, "cancel"), variant: "warning" }))) return;
    if (nextBusinessId !== businessId) { setAmount(""); setNote(""); clearAttachment(); }
    setBusinessId(nextBusinessId);
  };
  const payload = () => ({ date: operationDate, businessId, type: kind, categoryId: kind === "expense" ? category : kind, amount: toAmount(amount), note, attachment });
  const categoryLabel = kind === "expense" ? text(lang, activeCategories.find((item) => item.id === category)?.label || "other") : text(lang, kind);
  const submit = () => canSave && !processing && !saving && onSave(payload());
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto w-full pb-24 sm:max-w-[560px] lg:max-w-none">
      <BackTitle lang={lang} title={text(lang, "addOutflow")} onBack={onBack} />
      <div className="space-y-5 taq-page-gutter">
        {showStorePicker ? (
          <div>
            <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "operationStore")}</p>
            <StoreOperationPicker lang={lang} businessesList={businessesList} selectedId={businessId} onSelect={changeStore} />
            <p className={`mt-2 text-taq-meta font-bold ${selectedStore ? "text-[#827762]" : "text-[#B44747]"}`}>
              {!selectedStore ? text(lang, "chooseStoreToStartEntry") : null}
            </p>
          </div>
        ) : null}
        <fieldset disabled={!formEnabled} className="min-w-0 space-y-5 border-0 p-0 m-0 disabled:opacity-55">
        <EntryDatePicker lang={lang} value={operationDate} onChange={setOperationDate} />
        {!showStorePicker ? (
          <div>
            <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "operationStore")}</p>
            <StoreOperationPicker lang={lang} businessesList={businessesList} selectedId={businessId} onSelect={changeStore} />
            <p className={`mt-2 text-taq-meta font-bold ${selectedStore ? "text-[#827762]" : "text-[#B44747]"}`}>{!selectedStore ? text(lang, "chooseOperationStore") : null}</p>
          </div>
        ) : null}
        <div>
          <p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "transactionType")}</p>
          <div className="grid grid-cols-3 gap-2">{["expense", "purchases", "withdrawal"].map((item) => <Choice key={item} active={kind === item} onClick={() => setKind(item)}>{text(lang, item)}</Choice>)}</div>
        </div>
        {kind === "expense" && <div><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "category")}</p>{activeCategories.length ? <div className="grid grid-cols-3 gap-2">{activeCategories.map((item) => <Choice key={item.id} active={category === item.id} onClick={() => setCategory(item.id)}>{text(lang, item.label)}</Choice>)}</div> : <p className="rounded-xl bg-[#FFF1EE] p-3 text-taq-meta font-bold text-[#B44747]">{text(lang, "atLeastOneCategory")}</p>}</div>}
        <div className="rounded-3xl bg-white p-5 ring-1 ring-black/[0.05]">
          <p className="text-xs font-bold text-[#716753]">{text(lang, "amount")}</p>
          <div className="mt-2 flex items-center gap-2" dir="ltr">
            <input inputMode="decimal" value={amount} onChange={(event) => setAmount(sanitizeAmountInput(event.target.value))} placeholder="0" className="w-full min-w-0 bg-transparent text-4xl font-black outline-none" />
            <span className="mt-3 text-sm font-bold text-[#786D58]">{lang === "ar" ? "ر.س" : "SAR"}</span>
          </div>
          {toAmount(amount) > 0 ? (
            <div className="mt-4 border-t border-[#E8E1D4] pt-3">
              <p className="text-taq-nav font-bold text-[#827762]">{text(lang, "captureAttachment")} ({text(lang, "optional")})</p>
              {!resolveAttachmentPreviewSrc(attachment) ? (
                <ProofAddButton lang={lang} onSelect={selectAttachment} disabled={processing} processing={processing} className="mt-2" />
              ) : null}
              {error ? <p className="mt-2 text-taq-nav font-black text-[#B44747]">{error}</p> : null}
              <ProofAttachmentPreview
                lang={lang}
                src={resolveAttachmentPreviewSrc(attachment)}
                onRemove={clearAttachment}
              />
            </div>
          ) : null}
        </div>
        <div><SmallInfo label={text(lang, "category")} value={categoryLabel} /></div>
        <div className="rounded-3xl bg-white p-4 ring-1 ring-black/[0.05]"><p className="mb-2 text-xs font-bold text-[#716753]">{text(lang, "note")} <span className="font-normal">({text(lang, "optional")})</span></p><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={text(lang, "notePlaceholder")} className="min-h-[52px] w-full resize-none rounded-2xl bg-[#F7F5EF] px-4 py-3 text-sm outline-none" /></div>
        <button type="button" disabled={!canSave || processing || saving} onClick={submit} className={`w-full rounded-2xl py-4 text-sm font-extrabold text-white transition ${canSave && !processing && !saving ? "bg-[#112A46]" : "cursor-not-allowed bg-[#B8C0B7]"}`}>{text(lang, saving ? "saving" : "saveOutflow")}</button>
        </fieldset>
      </div>
    </motion.section>
  );
}
