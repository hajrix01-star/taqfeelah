"use client";

import React from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { resolveAppFontFamily } from "@/core/fonts/app-font-family";
import { formatCalendarDate } from "@/features/reports/client/report-period-labels";
import { businessName, money, opTime, text } from "./taqfeelah-app-catalog-data";
import {
  entryHasAttachment,
  operationDisplayLabel,
  signedEntryAmount,
} from "./taqfeelah-app-entry-helpers";
import { MoneyValue, FinancialRows } from "./taqfeelah-app-notebook";
import { Logo } from "./taqfeelah-app-chrome";
import { RatioBadge } from "./owner-summary-details";
import type { FinancialRow, NotebookShareImagePreviewProps } from "./taqfeelah-app-types";

export function NotebookShareImagePreview({
  previewRef,
  lang,
  snapshot,
  model,
}: NotebookShareImagePreviewProps) {
  const {
    monthly,
    combined,
    isOutflowReport,
    isChannelsReport,
    isDaysReport,
    isProofsReport,
    periodLabel,
    record,
    netMarginRatio,
    outflowCategoryLabel,
    outflowTotal,
    filteredOutflowEntries,
    outflowAverage,
    showOutflowOperations,
    shareOutflowOperations,
    shareChannelRows,
    shareDayRows,
    shareProofEntries,
    shareBusinessRows,
    detailedSummary,
    salesDetailRows,
    outflowDetailRows,
    activeTheme,
    lines,
  } = model;

  return (
    <div ref={previewRef} className="mb-4 overflow-hidden rounded-[24px] p-0 shadow-lg" style={{ backgroundColor: activeTheme.paper }}>
      <div className="relative px-5 pb-4 pt-3" style={{ ...lines, fontFamily: resolveAppFontFamily(lang) }}>
        <div>
          <div className="flex h-[54px] items-center justify-center">
            <Logo compact centered />
          </div>
          <div className="flex h-[44px] items-end justify-center gap-3 pb-[8px] text-taq-meta font-black text-[var(--taq-color-112a46)]">
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            <span>{periodLabel}</span>
            <CalendarDays className="h-4 w-4 shrink-0" />
          </div>
          <div className="flex h-[58px] items-end justify-center pb-[8px]">
            <div className="inline-flex flex-col items-center">
              <p className="whitespace-nowrap text-taq-body font-black leading-none text-[var(--taq-color-112a46)]">{snapshot.screen === "reports" ? text(lang, "reportNotebook") : monthly ? text(lang, "monthlySummary") : text(lang, "dailySummary")}</p>
              <span className="mt-2 block h-[2px] w-full rounded-full bg-[var(--taq-color-c28a30)]" />
            </div>
          </div>
          {combined ? <>
            <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[var(--taq-color-806528)]">{text(lang, "shopsComparisonReport")}</div>
            <div className="grid h-[44px] grid-cols-[1.05fr_0.9fr_0.9fr_0.9fr] items-end gap-1 pb-2 text-taq-nav font-bold text-[var(--taq-color-806528)]"><span>{text(lang, "store")}</span><span className="text-center">{text(lang, "salesShort")}</span><span className="text-center">{text(lang, "outflowShort")}</span><span className="text-center">{text(lang, "result")}</span></div>
            {shareBusinessRows.map((row) => <div key={row.business.id} className="grid h-[44px] grid-cols-[1.05fr_0.9fr_0.9fr_0.9fr] items-end gap-1 pb-2 text-taq-meta"><span className="truncate font-bold">{businessName(row.business, lang, true) || businessName(row.business, lang)}</span><strong className="text-center tabular-nums">{money(row.sales, lang)}</strong><strong className="text-center tabular-nums text-[var(--taq-color-b44747)]">{money(row.expense, lang)}</strong><strong className={`text-center tabular-nums ${row.net < 0 ? "text-[var(--taq-color-b44747)]" : "text-[var(--taq-color-257844)]"}`}>{money(row.net, lang)}</strong></div>)}
            <div className="mt-1 grid h-[55px] grid-cols-[1.05fr_0.9fr_0.9fr_0.9fr] items-end gap-1 border-t-2 border-[var(--taq-color-112a46)]/55 pb-2 text-taq-meta"><span className="font-bold">{text(lang, "combinedTotal")}</span><strong className="text-center tabular-nums">{money(record.sales, lang)}</strong><strong className="text-center tabular-nums text-[var(--taq-color-b44747)]">{money(record.expense, lang)}</strong><strong className={`text-center tabular-nums ${record.net < 0 ? "text-[var(--taq-color-b44747)]" : "text-[var(--taq-color-257844)]"}`}>{money(record.net, lang)}</strong></div>
          </> : isOutflowReport ? <>
            <div className="flex min-h-[44px] items-end pb-2 text-taq-meta font-bold text-[var(--taq-color-806528)]">{text(lang, "detailedOutflowReport")} {outflowCategoryLabel}</div>
            <FinancialRows lang={lang} rows={[
              { id: "share-total", label: text(lang, "totalOutflow"), value: money(outflowTotal, lang), valueClassName: "text-[var(--taq-color-b44747)]" },
              { id: "share-count", label: text(lang, "numberTransactions"), value: `${filteredOutflowEntries.length}` },
              { id: "share-average", label: text(lang, "averageTransaction"), value: money(outflowAverage, lang), valueClassName: "text-[var(--taq-color-806528)]" },
            ] as FinancialRow[]} />
            {showOutflowOperations && (
              <div className="pt-1">
                <div className="flex h-[44px] items-end pb-[8px]">
                  <p className="inline-flex flex-col text-taq-meta font-black text-[var(--taq-color-112a46)]">
                    <span>{text(lang, "operations")}</span>
                    <span className="mt-1.5 h-[2px] w-full rounded-full bg-[var(--taq-color-c28a30)]" />
                  </p>
                </div>
                {shareOutflowOperations.length ? shareOutflowOperations.map((item, index) => (
                  <div key={`share-outflow-operation-${item.id}`} className={`grid min-h-[44px] w-full grid-cols-[max-content_minmax(0,1fr)] items-center gap-3 py-2 ${index < shareOutflowOperations.length - 1 ? "border-b border-[var(--taq-color-d9dfe3)]/70" : ""}`}>
                    <strong dir="ltr" className="min-w-[68px] whitespace-nowrap text-start tabular-nums text-taq-meta font-black text-[var(--taq-color-b44747)]">
                      <MoneyValue value={money(signedEntryAmount(item), lang)} />
                    </strong>
                    <span className="min-w-0 text-end">
                      <span className="block truncate text-taq-meta font-bold text-[var(--taq-color-112a46)]">{operationDisplayLabel(item, lang)}</span>
                      <small className="mt-0.5 block truncate text-taq-nav font-bold text-[var(--taq-color-8a816f)]">{formatCalendarDate(String(item.date ?? ""), lang)} {opTime(item, lang)} {entryHasAttachment(item) ? text(lang, "attachmentExists") : text(lang, "noAttachment")}</small>
                    </span>
                  </div>
                )) : (
                  <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[var(--taq-color-806528)]">{text(lang, "noOutflowPeriod")}</div>
                )}
              </div>
            )}
          </> : isChannelsReport ? <>
            <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[var(--taq-color-806528)]">{text(lang, "channelsReport")}</div>
            {shareChannelRows.length ? shareChannelRows.map((row) => <div key={row.id} className="flex h-[44px] items-end justify-between pb-2 text-sm"><span>{row.label}</span><strong className="tabular-nums">{money(row.amount, lang)}</strong></div>) : <div className="flex h-[44px] items-end pb-2 text-xs text-[var(--taq-color-806528)]">{text(lang, "noSalesChannelsPeriod")}</div>}
          </> : isDaysReport ? <>
            <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[var(--taq-color-806528)]">{text(lang, "daysReport")}</div>
            {shareDayRows.length ? <><div className="grid h-[44px] grid-cols-[1.25fr_1fr_1fr] items-end gap-1 pb-2 text-taq-nav font-bold text-[var(--taq-color-806528)]"><span>{text(lang, "day")}</span><span className="text-center">{text(lang, "salesShort")}</span><span className="text-center">{text(lang, "outflowShort")}</span></div>{shareDayRows.map((row) => <div key={row.date} className="grid h-[44px] grid-cols-[1.25fr_1fr_1fr] items-end gap-1 pb-2 text-taq-meta"><span className="truncate font-bold">{formatCalendarDate(row.date, lang)}</span><strong className="text-center tabular-nums">{money(row.sales, lang)}</strong><strong className="text-center tabular-nums text-[var(--taq-color-b44747)]">{money(row.expense, lang)}</strong></div>)}</> : <div className="flex h-[44px] items-end pb-2 text-xs text-[var(--taq-color-806528)]">{text(lang, "noCloseoutsPeriod")}</div>}
          </> : isProofsReport ? <>
            <div className="flex h-[44px] items-end pb-2 text-taq-meta font-bold text-[var(--taq-color-806528)]">{text(lang, "attachmentsReport")}</div>
            <div className="flex h-[44px] items-end justify-between pb-2 text-sm"><span>{text(lang, "totalAttachments")}</span><strong className="tabular-nums">{shareProofEntries.length}</strong></div>
          </> : <>
            <div className="flex h-[44px] items-end justify-between pb-2 text-sm"><span>{text(lang, "sales")}</span><strong className="tabular-nums"><MoneyValue value={money(record.sales, lang)} /></strong></div>
            {detailedSummary && salesDetailRows.map((row) => (
              <div key={`image-sales-${row.label}`} className="flex h-[44px] items-end justify-between pb-2 ps-3 text-xs">
                <div className="flex items-center gap-2"><span className="text-[var(--taq-color-716753)]">{row.label}</span><RatioBadge value={row.ratio} /></div>
                <strong className="tabular-nums text-[var(--taq-color-112a46)]"><MoneyValue value={row.value} /></strong>
              </div>
            ))}
            <div className="flex h-[44px] items-end justify-between pb-2 text-sm text-[var(--taq-color-b44747)]"><span>{text(lang, "purchasesExpenses")}</span><strong className="tabular-nums"><MoneyValue value={money(record.expense, lang)} /></strong></div>
            {detailedSummary && outflowDetailRows.map((row) => (
              <div key={`image-outflow-${row.label}`} className="flex h-[44px] items-end justify-between pb-2 ps-3 text-xs">
                <div className="flex items-center gap-2"><span className="text-[var(--taq-color-716753)]">{row.label}</span><RatioBadge value={row.ratio} /></div>
                <strong className="tabular-nums text-[var(--taq-color-b44747)]"><MoneyValue value={row.value} /></strong>
              </div>
            ))}
            {netMarginRatio !== "—" ? (
              <div className="flex h-[44px] items-end justify-between pb-2 text-xs text-[var(--taq-color-806528)]">
                <span>{text(lang, "netMarginRatio")}</span>
                <strong className="text-[var(--taq-color-827762)]">{netMarginRatio} {text(lang, "netMarginOfSales")}</strong>
              </div>
            ) : null}
            <div className="mt-1 flex h-[55px] items-end justify-between border-t-2 border-[var(--taq-color-112a46)]/55 pb-2"><span className="text-sm font-bold">{text(lang, "result")}</span><strong className={`tabular-nums text-xl font-extrabold ${record.net < 0 ? "text-[var(--taq-color-b44747)]" : "text-[var(--taq-color-257844)]"}`}><MoneyValue value={money(record.net, lang)} /></strong></div>
          </>}
        </div>
      </div>
    </div>
  );
}
