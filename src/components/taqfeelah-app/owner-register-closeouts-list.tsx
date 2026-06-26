"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { formatCloseoutDayLabel } from "@/features/closeouts/client/closeout-day-label";
import { formatCalendarDate, formatRegisterCloseoutTypeLabel } from "@/features/reports/client/report-period-labels";
import {
  canRestoreOperationalEntry,
  canVoidOperationalEntry,
} from "@/features/operations/operational-entry-mutation-helpers";
import { canManageRegisterCloseoutSummary } from "@/features/operations/client/register-closeout-summary-actions";
import { registerSalesChannelBadgeLabel } from "@/features/entries/client/register-log-display";
import { businessName, money, opTime, text } from "./taqfeelah-app-catalog-data";
import {
  entryHasAttachment,
  entryIsVoided,
  expandRegisterCloseoutOperationRows,
} from "./taqfeelah-app-entry-helpers";
import { MoneyValue } from "./taqfeelah-app-notebook";
import { RegisterStoreBadge } from "./owner-register-ui-primitives";
import CloseoutOwnerEditBadge from "@/features/closeouts/client/CloseoutOwnerEditBadge";
import { AttachmentThumbButton } from "./taqfeelah-app-attachment-ui";
import type { DisplayLang, EntryAttachmentApiContext, AppBusiness, AppChannel, RegisterLogFilters } from "./taqfeelah-app-types";
import type { OperationalEntry } from "@/features/entries/client/entries-client-types";
import type { RegisterCloseoutSummary } from "@/features/entries/client/register-log-display";
import type { Dispatch, SetStateAction } from "react";

export type RegisterCloseoutSummaryRow = RegisterCloseoutSummary & { key: string };

function RegisterCloseoutOperationActions({
  lang,
  item,
  archivedBusinessIds,
  onOpenOperation,
  onVoidOperation,
  onRestoreOperation,
}: {
  lang: DisplayLang;
  item: OperationalEntry;
  archivedBusinessIds: string[];
  onOpenOperation: (item: OperationalEntry) => void;
  onVoidOperation: (entryId: string) => void;
  onRestoreOperation: (entryId: string) => void;
}) {
  const voided = entryIsVoided(item);
  const canVoid = canVoidOperationalEntry(item, archivedBusinessIds, entryIsVoided);
  const canRestore = canRestoreOperationalEntry(item, archivedBusinessIds, entryIsVoided);

  return (
    <div className="flex flex-wrap items-center gap-1">
      <button
        type="button"
        onClick={() => onOpenOperation(item)}
        className="rounded-lg bg-[#F7F5EF] px-2 py-1 text-[10px] font-black text-[#112A46] ring-1 ring-[#E8E1D4]"
      >
        {lang === "ar" ? "تفاصيل" : "Details"}
      </button>
      {canVoid ? (
        <button
          type="button"
          onClick={() => onVoidOperation(String(item.id))}
          className="rounded-lg bg-[#FFF1EE] px-2 py-1 text-[10px] font-black text-[#B44747] ring-1 ring-[#F0C8C2]"
        >
          {lang === "ar" ? "إلغاء" : "Void"}
        </button>
      ) : null}
      {canRestore ? (
        <button
          type="button"
          onClick={() => onRestoreOperation(String(item.id))}
          className="rounded-lg bg-[#E6F5E9] px-2 py-1 text-[10px] font-black text-[#257844] ring-1 ring-[#C8E8D2]"
        >
          {lang === "ar" ? "استعادة" : "Restore"}
        </button>
      ) : null}
      {voided ? (
        <span className="rounded-full bg-[#FFF4D2] px-2 py-0.5 text-[9px] font-black text-[#806528]">
          {text(lang, "voided")}
        </span>
      ) : null}
    </div>
  );
}

export function OwnerRegisterCloseoutsList({
  lang,
  closeoutSummaries,
  logFilters,
  showStoreBadge = false,
  entryAttachmentApiContext,
  expandedCloseoutKey,
  setExpandedCloseoutKey,
  archivedBusinessIds = [],
  onOpenOperation,
  onVoidOperation = () => {},
  onRestoreOperation = () => {},
  onEditCloseout = () => {},
  onDeleteCloseout = () => {},
  onPreviewAttachment,
  registerScrollId,
  loading,
  loadError,
  loadErrorMessage,
  configuredChannels,
}: {
  lang: DisplayLang;
  closeoutSummaries: RegisterCloseoutSummaryRow[];
  logFilters: RegisterLogFilters;
  showStoreBadge?: boolean;
  entryAttachmentApiContext?: EntryAttachmentApiContext;
  expandedCloseoutKey: string | null;
  setExpandedCloseoutKey: Dispatch<SetStateAction<string | null>>;
  archivedBusinessIds?: string[];
  onOpenOperation: (item: OperationalEntry) => void;
  onVoidOperation?: (entryId: string) => void;
  onRestoreOperation?: (entryId: string) => void;
  onEditCloseout?: (summary: RegisterCloseoutSummaryRow) => void;
  onDeleteCloseout?: (summary: RegisterCloseoutSummaryRow) => void;
  onPreviewAttachment?: (src: string, context?: Record<string, unknown>) => void;
  registerScrollId: (key: string) => string;
  loading?: boolean;
  loadError?: boolean;
  loadErrorMessage?: string;
  configuredChannels?: AppChannel[];
}) {
  if (loadError) {
    return (
      <div className="rounded-[18px] bg-white px-4 py-8 text-center text-taq-meta font-bold text-[#B44747] ring-1 ring-[#B44747]/10">{loadErrorMessage}</div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-[18px] bg-white px-4 py-8 text-center text-taq-meta font-bold text-[#827762] ring-1 ring-[#E8E1D4]">
        {lang === "ar" ? "جاري تحميل التقفيلات من الخادم..." : "Loading closeouts from the server..."}
      </div>
    );
  }

  if (closeoutSummaries.length === 0) {
    return (
      <div className="rounded-[18px] bg-white px-4 py-8 text-center text-taq-meta font-bold text-[#827762] ring-1 ring-[#E8E1D4]">{text(lang, "noCloseoutsPeriod")}</div>
    );
  }

  return (
    <div className="space-y-2.5">
      {closeoutSummaries.map((summary) => {
        const isExpanded = expandedCloseoutKey === summary.key;
        const store = summary.store as AppBusiness | null | undefined;
        const storeLabel = businessName(store, lang, true) || businessName(store, lang);
        const operationRows = summary.operations.flatMap((item) => expandRegisterCloseoutOperationRows(item, lang, logFilters.salesChannel, configuredChannels));
        const summaryBusinessId = String(summary.businessId ?? store?.id ?? "");
        const canManageCloseout = canManageRegisterCloseoutSummary({
          closeoutId: summary.closeoutId ?? summary.key,
          businessId: summaryBusinessId,
        }, archivedBusinessIds);
        const operationsCountLabel = lang === "ar"
          ? `عرض العمليات (${operationRows.length})`
          : `Show operations (${operationRows.length})`;

        return (
          <article id={`register-closeout-${registerScrollId(summary.key)}`} key={summary.key} className="overflow-hidden rounded-[18px] border border-[#E8E1D4]/90 bg-white shadow-[0_2px_4px_rgba(17,42,70,0.04),0_8px_20px_rgba(17,42,70,0.06)]">
            <button type="button" onClick={() => setExpandedCloseoutKey((current) => (current === summary.key ? null : summary.key))} className="flex w-full items-start gap-2.5 px-3.5 py-3 text-start">
              <ChevronDown className={`mt-0.5 h-5 w-5 shrink-0 text-[#112A46] transition ${isExpanded ? "rotate-180" : ""}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <p className="text-taq-meta font-black text-[#112A46]">{formatCloseoutDayLabel({ formattedDate: formatCalendarDate(String(summary.date ?? ""), lang), daySequence: summary.daySequence ?? undefined, sameDayCloseoutCount: summary.sameDayCloseoutCount ?? undefined })}</p>
                    {showStoreBadge ? <RegisterStoreBadge label={storeLabel} /> : null}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <CloseoutOwnerEditBadge lang={lang} source={{
                      closeoutId: summary.closeoutId ?? summary.key,
                      businessId: summaryBusinessId,
                    }} />
                    <p className="rounded-full border border-[#8EA1C4] px-2.5 py-1 text-taq-meta font-black text-[#214B7B]">{lang === "ar" ? `بواسطة ${summary.actorLabel}` : `By ${summary.actorLabel}`}</p>
                  </div>
                </div>
                <p className="mt-1 text-taq-meta font-bold text-[#716753]">
                  {formatRegisterCloseoutTypeLabel(String(summary.date ?? ""), lang)}
                  {!showStoreBadge && storeLabel ? ` ${storeLabel}` : ""}
                </p>
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
                          {registerSalesChannelBadgeLabel(channel, text(lang, "summary"))} <span className="tabular-nums"><MoneyValue value={money(channel.amount, lang)} /></span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-taq-nav font-bold text-[#8B8274]">{text(lang, "noPaymentMethodsPeriod")}</p>
                  )
                )}
                <p className="mt-2 text-taq-meta font-black text-[#806528]">
                  {isExpanded ? (lang === "ar" ? "إخفاء العمليات" : "Hide operations") : operationsCountLabel}
                </p>
              </div>
            </button>
            {isExpanded && (
              <div className="border-t border-[#E8E1D4] bg-white px-3.5 py-2.5">
                <div className="divide-y divide-[#F0EBE0]">
                  {operationRows.map((row) => (
                    <div key={row.key} className="py-2.5 text-taq-meta first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="min-w-0 flex-1 font-bold text-[#112A46]">{row.label}</span>
                        <strong
                          dir="ltr"
                          className={`shrink-0 tabular-nums text-end font-black ${entryIsVoided(row.item) ? "text-[#A99D87] line-through" : row.isSale ? "text-[#257844]" : "text-[#B44747]"}`}
                        >
                          <MoneyValue value={money(row.amount, lang)} />
                        </strong>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                        <span className="text-taq-nav font-bold text-[#8A816F]">{opTime(row.item, lang)}</span>
                        {entryHasAttachment(row.item) ? (
                          <AttachmentThumbButton
                            attachment={row.item.attachment}
                            storeId={row.item.businessId}
                            lang={lang}
                            attachmentApiContext={entryAttachmentApiContext}
                            className="h-8 w-8"
                            buttonClassName="shrink-0 overflow-hidden rounded-lg ring-1 ring-black/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#112A46]/50 disabled:opacity-70"
                            onOpen={(src) => onPreviewAttachment?.(src, {
                              entry: row.item,
                              storeName: storeLabel,
                              operationLabel: row.label,
                              entryTime: opTime(row.item, lang),
                              daySequence: summary.daySequence,
                              sameDayCloseoutCount: summary.sameDayCloseoutCount,
                            })}
                          />
                        ) : (
                          <span className="text-taq-nav font-bold text-[#C8BCA4]">—</span>
                        )}
                        <div className="ms-auto min-w-0">
                          <RegisterCloseoutOperationActions
                            lang={lang}
                            item={row.item}
                            archivedBusinessIds={archivedBusinessIds}
                            onOpenOperation={onOpenOperation}
                            onVoidOperation={onVoidOperation}
                            onRestoreOperation={onRestoreOperation}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {canManageCloseout ? (
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#E8E1D4] pt-3">
                    <button
                      type="button"
                      onClick={() => onEditCloseout(summary)}
                      className="rounded-xl bg-[#112A46] py-2.5 text-taq-meta font-black text-white"
                    >
                      {lang === "ar" ? "تعديل التقفيلة" : "Edit closeout"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCloseout(summary)}
                      className="rounded-xl bg-[#FFF1EE] py-2.5 text-taq-meta font-black text-[#B44747] ring-1 ring-[#F0C8C2]"
                    >
                      {lang === "ar" ? "حذف التقفيلة" : "Delete closeout"}
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
