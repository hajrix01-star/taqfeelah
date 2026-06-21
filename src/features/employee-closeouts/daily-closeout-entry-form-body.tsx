"use client";

import { useState, type ChangeEvent, createElement } from "react";
import { Plus } from "lucide-react";
import { sanitizeAmountInput } from "../../components/prototype-runtime/prototype-runtime-entry-form-utils";
import { formatCalendarDate } from "@/features/reports/client/report-period-labels";
import type { CloseoutSyncLang, SalesChannelConfig, StoreRef } from "@/features/daily-closeouts/daily-closeouts-types";
import type { CloseoutOutflowRow } from "./employee-closeouts-types";
import type { DailyCloseoutEntryState } from "./use-daily-closeout-entry-state";
import {
  EXPENSE_CATEGORIES,
  OUTFLOW_TYPES,
  formatCloseoutMoney,
  moneyInputClass,
  resolveAttachmentPreviewSrc,
} from "./daily-closeout-entry-helpers";
import { EntrySection } from "./daily-closeout-entry-ui-primitives";
import {
  ProofAddButton,
  ProofAttachmentPreview,
} from "@/components/prototype-runtime/prototype-runtime-attachment-ui";
import { appAlert } from "@/lib/ui/app-dialog/app-dialog-bridge";
import { text } from "@/components/prototype-runtime/prototype-runtime-demo-data";
import { DateSelector } from "@/components/prototype-runtime/prototype-runtime-notebook";
import { CloseoutEntryStorePicker } from "./closeout-entry-store-picker";

type DailyCloseoutEntryFormBodyProps = DailyCloseoutEntryState & {
  lang: CloseoutSyncLang;
  storeName?: string;
  assignedStores?: StoreRef[];
  selectedStoreId?: string;
  onSelectEntryStore?: (storeId: string) => void | Promise<void>;
  formEnabled?: boolean;
  salesChannels: SalesChannelConfig[];
};

function ChannelAmountGrid({
  channels,
  labelChannel,
  salesValues,
  updateSalesValue,
  moneyInputClass: inputClass,
}: {
  channels: SalesChannelConfig[];
  labelChannel: (channel: SalesChannelConfig) => string;
  salesValues: Record<string, string>;
  updateSalesValue: (channelId: string, value: string) => void;
  moneyInputClass: string;
}) {
  if (channels.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {channels.map((channel) => (
        <label key={channel.id} className="flex flex-col items-center rounded-2xl bg-white px-2 py-3 text-center ring-1 ring-black/[0.05]">
          <span className="mb-2 block w-full text-taq-meta font-bold text-[#827762]">{labelChannel(channel)}</span>
          <input
            inputMode="decimal"
            dir="ltr"
            value={salesValues[channel.id] || ""}
            onChange={(event) => updateSalesValue(channel.id, event.target.value)}
            className={inputClass}
            placeholder="0"
          />
        </label>
      ))}
    </div>
  );
}

export function DailyCloseoutEntryFormBody({
  lang,
  date,
  setDate,
  storeName,
  assignedStores = [],
  selectedStoreId = "",
  onSelectEntryStore = () => {},
  formEnabled = true,
  titles,
  salesChannels,
  labelChannel,
  salesValues,
  updateSalesValue,
  totals,
  outType,
  setOutType,
  expenseCategory,
  setExpenseCategory,
  outAmount,
  setOutAmount,
  outNote,
  setOutNote,
  pushOutflow,
  outflows,
  removeOutflow,
  removeOutflowAttachment,
  addOutflowAttachment,
  outflowAttachmentProcessingId,
  attachments,
  attachmentProcessing,
  attachmentError,
  onFiles,
  setPreviewAttachment,
  removeAttachment,
  todayIso,
}: DailyCloseoutEntryFormBodyProps) {
  const [dateEditing, setDateEditing] = useState(false);

  const confirmDateEdit = async (nextDate: string) => {
    if (!nextDate) {
      await appAlert({ lang, title: text(lang, "chooseCloseoutDate"), variant: "warning" });
      return;
    }
    if (nextDate > todayIso()) {
      await appAlert({ lang, title: text(lang, "futureDateNotAllowed"), variant: "warning" });
      return;
    }
    setDate(nextDate);
    setDateEditing(false);
  };

  return (
    <>
      <CloseoutEntryStorePicker
        lang={lang}
        stores={assignedStores}
        selectedStoreId={selectedStoreId}
        onSelectStore={onSelectEntryStore}
      />
      <fieldset disabled={!formEnabled} className="min-w-0 border-0 p-0 m-0 disabled:opacity-55">
      <div className="mb-4 rounded-2xl border border-[#E8E1D4] bg-[rgba(255,253,248,0.9)] px-4 py-3">
        {dateEditing ? (
          <div className="space-y-3">
            <p className="text-taq-meta font-bold text-[#827762]">{lang === "ar" ? "تاريخ التقفيلة" : "Closeout date"}</p>
            {createElement(DateSelector as unknown as React.ComponentType<Record<string, unknown>>, {
              compact: true,
              lang,
              period: "day",
              setPeriod: () => {},
              allowedPeriods: ["day"],
              selectedDate: date,
              setSelectedDate: (nextDate: string) => { void confirmDateEdit(nextDate); },
              maxDate: todayIso(),
              fullCalendar: true,
              initialOpen: true,
            })}
            <button
              type="button"
              onClick={() => setDateEditing(false)}
              className="w-full rounded-xl bg-white py-2 text-taq-meta font-black ring-1 ring-black/[0.06]"
            >
              {lang === "ar" ? "تم" : "Done"}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-taq-meta font-bold text-[#827762]">{lang === "ar" ? "تاريخ التقفيلة" : "Closeout date"}</p>
              <p className="text-sm font-black tabular-nums text-[#112A46]">{formatCalendarDate(date, lang)}</p>
              {assignedStores.length <= 1 && storeName ? (
                <p className="mt-1 text-taq-nav font-bold text-[#827762]">{storeName}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setDateEditing(true)}
              className="shrink-0 rounded-xl bg-white px-3 py-2 text-taq-meta font-black ring-1 ring-black/[0.06]"
            >
              {lang === "ar" ? "تغيير" : "Change"}
            </button>
          </div>
        )}
      </div>
      <EntrySection number={1} title={titles.sales} lang={lang}>
        {salesChannels.length === 0 ? (
          <p className="rounded-2xl bg-[#FFF1EE] p-3 text-xs font-bold text-[#B44747]">{text(lang, "noSalesChannels")}</p>
        ) : (
          <div>
            <p className="mb-2 text-taq-nav font-black text-[#806528]">{text(lang, "paymentMethods")}</p>
            <ChannelAmountGrid
              channels={salesChannels}
              labelChannel={labelChannel}
              salesValues={salesValues}
              updateSalesValue={updateSalesValue}
              moneyInputClass={moneyInputClass}
            />
          </div>
        )}
        <div className="rounded-2xl border border-[#E8E1D4] bg-[#FAF3E3] px-3 py-3">
          <div className="flex items-center justify-between font-extrabold">
            <span className="text-sm">{lang === "ar" ? "إجمالي الداخل" : "Total sales"}</span>
            <span className="tabular-nums text-[#112A46]">{formatCloseoutMoney(totals.totalSales || 0, lang)} ر.س</span>
          </div>
          {(totals.totalSales || 0) > 0 ? (
            <div className="mt-3 border-t border-[#E8E1D4]/80 pt-3">
              {attachments.length < 6 ? (
                <ProofAddButton
                  lang={lang}
                  onSelect={onFiles}
                  multiple
                  disabled={attachmentProcessing}
                  processing={attachmentProcessing}
                  className="mt-2"
                />
              ) : null}
              {attachmentProcessing ? (
                <p className="mt-2 text-taq-nav font-bold text-[#827762]">
                  {lang === "ar" ? "جاري ضغط الصور..." : "Compressing images..."}
                </p>
              ) : null}
              {attachmentError ? (
                <p className="mt-2 text-taq-nav font-black text-[#B44747]">{attachmentError}</p>
              ) : null}
              {attachments.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {attachments.map((item, index) => {
                    const src = resolveAttachmentPreviewSrc(item);
                    if (!src) return null;
                    return (
                      <div key={`thumb-${index}`} className="relative">
                        <button
                          type="button"
                          onClick={() => setPreviewAttachment(src)}
                          className="rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#112A46]/50"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" className="h-16 w-16 rounded-xl object-cover" />
                        </button>
                        <button type="button" onClick={() => removeAttachment(index)} className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#B44747] text-taq-meta text-white">×</button>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </EntrySection>
      <EntrySection number={2} title={titles.outflows} lang={lang}>
        <div className="flex flex-wrap gap-2">
          {OUTFLOW_TYPES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setOutType(item.id)}
              className={`rounded-full px-3 py-2 text-taq-meta font-black ${outType === item.id ? "bg-[#112A46] text-white" : "bg-white text-[#716753] ring-1 ring-[#E8E1D4]"}`}
            >
              {lang === "ar" ? item.ar : item.en}
            </button>
          ))}
        </div>
        {outType === "expense" && (
          <div className="flex flex-wrap gap-2">
            {EXPENSE_CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setExpenseCategory(item.id)}
                className={`rounded-full px-2.5 py-1.5 text-taq-meta font-black ${expenseCategory === item.id ? "bg-[#E4B84A] text-[#112A46]" : "bg-white ring-1 ring-[#E8E1D4]"}`}
              >
                {lang === "ar" ? item.ar : item.en}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-stretch gap-2">
          <input
            value={outAmount}
            onChange={(event) => setOutAmount(sanitizeAmountInput(event.target.value))}
            inputMode="decimal"
            dir="ltr"
            placeholder={lang === "ar" ? "المبلغ" : "Amount"}
            className="min-w-0 flex-1 rounded-2xl bg-white px-4 py-3 text-center text-sm font-bold ring-1 ring-black/[0.06] [direction:ltr]"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                pushOutflow();
              }
            }}
          />
          <button
            type="button"
            onClick={pushOutflow}
            aria-label={lang === "ar" ? "إضافة بند" : "Add line"}
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl bg-[#112A46] text-white shadow-sm"
          >
            <Plus className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>
        <input value={outNote} onChange={(event) => setOutNote(event.target.value)} placeholder={lang === "ar" ? "ملاحظة (اختياري)" : "Note (optional)"} className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold ring-1 ring-black/[0.06]" />
        {outflows.length > 0 ? (
          <div className="space-y-3">
            {outflows.map((row) => {
              const proofSrc = row.attachments?.map(resolveAttachmentPreviewSrc).find(Boolean) ?? "";
              const processingProof = outflowAttachmentProcessingId === row.id;
              return (
                <div key={row.id} className="space-y-2">
                  <div className="rounded-2xl bg-white px-3 py-2 ring-1 ring-black/[0.05]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 flex-1 text-xs font-bold">{row.typeLabel || row.type}{row.category ? ` · ${row.category}` : ""}</span>
                      <div className="flex shrink-0 items-center gap-2">
                        <strong className="text-sm font-black tabular-nums text-[#B44747]">{formatCloseoutMoney(row.amount, lang)}</strong>
                        <button type="button" onClick={() => removeOutflow(row.id)} className="text-[#B44747]">×</button>
                      </div>
                    </div>
                  </div>
                  {proofSrc ? (
                    <ProofAttachmentPreview
                      lang={lang}
                      src={proofSrc}
                      onOpen={setPreviewAttachment}
                      onRemove={() => removeOutflowAttachment(row.id)}
                    />
                  ) : (
                    <>
                      <ProofAddButton
                        lang={lang}
                        onSelect={(event: ChangeEvent<HTMLInputElement>) => addOutflowAttachment(row.id, event)}
                        processing={processingProof}
                      />
                      {processingProof ? (
                        <p className="text-taq-nav font-bold text-[#827762]">{text(lang, "processingPhoto")}</p>
                      ) : null}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}
      </EntrySection>
      <EntrySection number={3} title={titles.review} lang={lang}>
        <div className="space-y-2 rounded-2xl bg-white p-4 ring-1 ring-black/[0.05]">
          <div className="flex justify-between text-sm font-bold"><span>{lang === "ar" ? "إجمالي الداخل" : "Total in"}</span><span className="tabular-nums">{formatCloseoutMoney(totals.totalSales || 0, lang)} ر.س</span></div>
          <div className="flex justify-between text-sm font-bold text-[#B44747]"><span>{lang === "ar" ? "إجمالي الخارج" : "Total out"}</span><span className="tabular-nums">{formatCloseoutMoney(totals.totalOutflow, lang)} ر.س</span></div>
          <div className="flex justify-between text-base font-black text-[#257844]"><span>{lang === "ar" ? "الناتج" : "Net"}</span><span className="tabular-nums">{formatCloseoutMoney(totals.netMovement, lang)} ر.س</span></div>
        </div>
      </EntrySection>
      </fieldset>
    </>
  );
}
