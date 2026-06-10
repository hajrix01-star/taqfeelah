"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { formatCloseoutDayLabel } from "@/features/closeouts/client/closeout-day-label";
import { formatCalendarDate, formatRegisterCloseoutTypeLabel } from "@/features/reports/client/report-period-labels";
import { businessName, money, opTime, text } from "./prototype-runtime-demo-data";
import {
  entryHasAttachment,
  entryIsVoided,
  expandRegisterCloseoutOperationRows,
} from "./prototype-runtime-entry-helpers";
import { MoneyValue } from "./prototype-runtime-notebook";
import { AttachmentThumbButton } from "./prototype-runtime-attachment-ui";

export function OwnerRegisterCloseoutsList({
  lang,
  closeoutSummaries,
  logFilters,
  registerCardInsetStyle,
  entryAttachmentApiContext,
  expandedCloseoutKey,
  setExpandedCloseoutKey,
  onOpenOperation,
  setRegisterAttachmentPreview,
  registerScrollId,
  loadError,
  loadErrorMessage,
}) {
  if (loadError) {
    return (
      <div className="mx-5 rounded-[18px] bg-white px-4 py-8 text-center text-taq-meta font-bold text-[#B44747] ring-1 ring-[#B44747]/10">{loadErrorMessage}</div>
    );
  }

  if (closeoutSummaries.length === 0) {
    return (
      <div className="mx-5 rounded-[18px] bg-white px-4 py-8 text-center text-taq-meta font-bold text-[#827762] ring-1 ring-[#E8E1D4]">{text(lang, "noCloseoutsPeriod")}</div>
    );
  }

  return (
    <div className="space-y-2.5 px-5">
      {closeoutSummaries.map((summary) => {
        const isExpanded = expandedCloseoutKey === summary.key;
        const storeLabel = businessName(summary.store, lang, true) || businessName(summary.store, lang);
        return (
          <article id={`register-closeout-${registerScrollId(summary.key)}`} key={summary.key} className="overflow-hidden rounded-[18px] border border-[#E8E1D4]/90 bg-white shadow-[0_2px_4px_rgba(17,42,70,0.04),0_8px_20px_rgba(17,42,70,0.06)]">
            <button type="button" onClick={() => setExpandedCloseoutKey((current) => (current === summary.key ? null : summary.key))} className="flex w-full items-start gap-2.5 px-3.5 py-3 text-start">
              <ChevronDown className={`mt-0.5 h-5 w-5 shrink-0 text-[#112A46] transition ${isExpanded ? "rotate-180" : ""}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <p className="text-taq-meta font-black text-[#112A46]">{formatCloseoutDayLabel({ formattedDate: formatCalendarDate(summary.date, lang), daySequence: summary.daySequence, sameDayCloseoutCount: summary.sameDayCloseoutCount })}</p>
                  <p className="rounded-full border border-[#8EA1C4] px-2.5 py-1 text-taq-meta font-black text-[#214B7B]">{lang === "ar" ? `أدخلها ${summary.actorLabel}` : `Entered by ${summary.actorLabel}`}</p>
                </div>
                <p className="mt-1 text-taq-meta font-bold text-[#716753]">{formatRegisterCloseoutTypeLabel(summary.date, lang)} {storeLabel}</p>
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
                          {channel.name} <span className="tabular-nums"><MoneyValue value={money(channel.amount, lang)} /></span>
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
                    <div key={row.key} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 hover:bg-[#FFF4D2]/35">
                      {entryHasAttachment(row.item) ? (
                        <AttachmentThumbButton attachment={row.item.attachment} storeId={row.item.businessId} attachmentApiContext={entryAttachmentApiContext} onOpen={setRegisterAttachmentPreview} />
                      ) : null}
                      <button type="button" onClick={() => onOpenOperation(row.item)} className="flex min-w-0 flex-1 items-center gap-3 text-start">
                        <strong dir="ltr" className={`min-w-[70px] shrink-0 whitespace-nowrap text-start tabular-nums text-taq-meta font-black ${entryIsVoided(row.item) ? "text-[#A99D87] line-through" : row.isSale ? "text-[#257844]" : "text-[#B44747]"}`}>
                          <MoneyValue value={money(row.amount, lang)} />
                        </strong>
                        <span className="min-w-0 flex-1 text-end">
                          <span className="truncate text-taq-meta font-bold text-[#112A46]">{row.label}</span>
                          <small className="mt-0.5 block truncate text-taq-nav font-bold text-[#8A816F]">{opTime(row.item, lang)}</small>
                        </span>
                      </button>
                    </div>
                  )))}
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
