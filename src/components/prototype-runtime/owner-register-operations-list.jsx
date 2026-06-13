"use client";

import React from "react";
import { formatCloseoutDayLabel } from "@/features/closeouts/client/closeout-day-label";
import { summaryEntryDisplayAmount } from "@/features/entries/client/register-operation-display";
import { employeeDisplayName } from "@/features/employee-closeouts/employee-entries-display";
import { formatCalendarDate } from "@/features/reports/client/report-period-labels";
import { businessName, money, opTime, text } from "./prototype-runtime-demo-data";
import {
  entryHasAttachment,
  entryIsVoided,
  operationDisplayLabel,
} from "./prototype-runtime-entry-helpers";
import { MoneyValue } from "./prototype-runtime-notebook";
import { Badge } from "./prototype-runtime-shell-ui";
import { AttachmentThumbButton } from "./prototype-runtime-attachment-ui";

export function OwnerRegisterOperationsList({
  lang,
  businessesList,
  visibleEntries,
  logFilters,
  daySequenceByCloseoutId,
  sameDayCloseoutCountByStoreDate,
  registerCardInsetStyle,
  entryAttachmentApiContext,
  expandedEntryId,
  setExpandedEntryId,
  onOpenOperation,
  onPreviewAttachment,
  registerEntriesApiEnabled,
  apiRegisterEntriesHasMore,
  registerLoadMoreRef,
  loadError,
  loadErrorMessage,
}) {
  if (loadError) {
    return (
      <div className="rounded-[18px] bg-white px-4 py-8 text-center text-taq-meta font-bold text-[#B44747] ring-1 ring-[#B44747]/10">{loadErrorMessage}</div>
    );
  }

  if (visibleEntries.length === 0) {
    return (
      <div className="rounded-[18px] bg-white px-4 py-8 text-center text-taq-meta font-bold text-[#827762] ring-1 ring-[#E8E1D4]">{text(lang, "noOperationsMatch")}</div>
    );
  }

  return (
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
          <article id={`register-entry-${entry.id}`} key={entry.id} className="overflow-hidden rounded-[18px] border border-[#E8E1D4]/90 bg-white shadow-[0_2px_4px_rgba(17,42,70,0.04),0_8px_20px_rgba(17,42,70,0.06)]">
            <button type="button" onClick={() => setExpandedEntryId((current) => (current === entry.id ? null : entry.id))} className="flex w-full items-start gap-2.5 px-3.5 py-3 text-start">
              <span className={`mt-0.5 h-8 w-1 shrink-0 rounded-full ${isSale ? "bg-[#39A160]" : "bg-[#E4B84A]"}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-taq-meta font-black text-[#112A46]">{operationDisplayLabel(entry, lang, logFilters.salesChannel)}</p>
                  {entryIsVoided(entry) && <Badge tone="warning">{text(lang, "voided")}</Badge>}
                  {entryHasAttachment(entry) && <Badge tone="navy">{text(lang, "attachmentExists")}</Badge>}
                </div>
                <p className="mt-1 truncate text-taq-nav font-bold text-[#827762]">{registerDateLabel} {opTime(entry, lang)} {businessName(store, lang, true) || businessName(store, lang)} {actorLabel}</p>
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
                {entryHasAttachment(entry) ? (
                  <div className="mb-3">
                    <p className="mb-2 text-taq-nav font-black text-[#806528]">{text(lang, "attachmentExists")}</p>
                    <AttachmentThumbButton
                      attachment={entry.attachment}
                      storeId={entry.businessId}
                      attachmentApiContext={entryAttachmentApiContext}
                      onOpen={(src) => onPreviewAttachment(src, {
                        entry,
                        storeName: businessName(store, lang, true) || businessName(store, lang),
                        operationLabel: operationDisplayLabel(entry, lang, logFilters.salesChannel),
                        entryTime: opTime(entry, lang),
                        daySequence: registerDaySequence,
                        sameDayCloseoutCount: registerSameDayCloseoutCount,
                      })}
                    />
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-2 text-taq-meta font-bold text-[#716753]">
                  <div className="rounded-xl bg-[#F7F5EF] px-2.5 py-2 ring-1 ring-[#E8E1D4]">{lang === "ar" ? "المدخل" : "Entered by"}: {actorLabel}</div>
                  <div className="rounded-xl bg-[#F7F5EF] px-2.5 py-2 ring-1 ring-[#E8E1D4]">{lang === "ar" ? "المحل" : "Store"}: {businessName(store, lang, true) || businessName(store, lang)}</div>
                </div>
                <button type="button" onClick={() => onOpenOperation(entry)} className="mt-2.5 w-full rounded-xl bg-[#112A46] py-2.5 text-taq-meta font-black text-white">{lang === "ar" ? "عرض العملية" : "Open operation"}</button>
              </div>
            )}
          </article>
        );
      })}
      {registerEntriesApiEnabled && apiRegisterEntriesHasMore ? (
        <div ref={registerLoadMoreRef} className="h-px w-full shrink-0" aria-hidden="true" />
      ) : null}
    </div>
  );
}
