"use client";

import React from "react";
import { formatNetMarginOfSalesRatio } from "@/features/entries/client/register-log-display";
import {
  formatRegisterReportRowLabel,
  registerReportGranularityColumnLabel,
  REGISTER_REPORT_GRANULARITY,
} from "@/features/reports/client/register-report-granularity";
import { money, text } from "./taqfeelah-app-catalog-data";
import type { DisplayLang } from "./taqfeelah-app-types";
import type { RegisterReportGranularity } from "@/features/reports/client/register-report-granularity";
import { MoneyValue } from "./taqfeelah-app-notebook";

const GRID_CLASS = "grid grid-cols-[1.25fr_0.72fr_0.72fr_0.8fr] items-center gap-1";

function dayColumnAlignClass(lang: DisplayLang) {
  return lang === "ar" ? "text-right" : "text-left";
}

function NetValue({ lang, value }: { lang: DisplayLang; value: unknown }) {
  const amount = Number(value) || 0;
  const positive = amount >= 0;
  return (
    <strong className={`text-center tabular-nums ${positive ? "text-[#257844]" : "text-[#B44747]"}`}>
      <MoneyValue value={money(amount, lang)} />
    </strong>
  );
}

export function OwnerRegisterGeneralReportList({
  lang,
  rows = [],
  totals = { sales: 0, expense: 0, net: 0 },
  granularity = REGISTER_REPORT_GRANULARITY.DAY,
  loading = false,
  loadError = false,
  loadErrorMessage = "",
  needsStoreSelection = false,
}: {
  lang: DisplayLang;
  rows?: Array<Record<string, unknown>>;
  totals?: { sales: number; expense: number; net: number };
  granularity?: RegisterReportGranularity;
  loading?: boolean;
  loadError?: boolean;
  loadErrorMessage?: string;
  needsStoreSelection?: boolean;
}) {
  if (needsStoreSelection) {
    return (
      <div className="rounded-[18px] bg-white px-4 py-8 text-center text-taq-meta font-bold text-[#827762] ring-1 ring-[#E8E1D4]">
        {text(lang, "chooseStoreForDayReport")}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-[18px] bg-white px-4 py-8 text-center text-taq-meta font-bold text-[#B44747] ring-1 ring-[#B44747]/10">
        {loadErrorMessage}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-[18px] bg-white px-4 py-8 text-center text-taq-meta font-bold text-[#806528] ring-1 ring-[#E8E1D4]">
        {text(lang, "loading")}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-[18px] bg-white px-4 py-8 text-center text-taq-meta font-bold text-[#827762] ring-1 ring-[#E8E1D4]">
        {text(lang, "noMovementPeriod")}
      </div>
    );
  }

  const netMarginRatio = formatNetMarginOfSalesRatio(totals.sales, totals.net);
  const netPositive = Number(totals.net) >= 0;

  return (
    <article className="overflow-hidden rounded-[18px] border border-[#E8E1D4]/90 bg-white shadow-[0_2px_4px_rgba(17,42,70,0.04),0_8px_20px_rgba(17,42,70,0.06)]">
      <div className="border-b border-[#F0EBE0] px-3 py-2">
        <div className={`${GRID_CLASS} text-taq-nav font-bold text-[#806528]`}>
          <span className={dayColumnAlignClass(lang)}>
            {registerReportGranularityColumnLabel(granularity, lang)}
          </span>
          <span className="text-center">{text(lang, "salesShort")}</span>
          <span className="text-center">{text(lang, "outflowShort")}</span>
          <span className="text-center">{text(lang, "result")}</span>
        </div>
      </div>
      <div className="px-3 py-1">
        {rows.map((row, index) => (
          <div
            key={String(row.id ?? row.date ?? index)}
            className={`${GRID_CLASS} min-h-[44px] py-2 text-taq-meta ${index < rows.length - 1 ? "border-b border-[#F0EBE0]" : ""}`}
          >
            <span
              className={`block w-full truncate font-bold text-[#112A46] ${dayColumnAlignClass(lang)}`}
              dir="ltr"
            >
              {formatRegisterReportRowLabel(String(row.date ?? ""), granularity as RegisterReportGranularity, lang)}
            </span>
            <strong className="text-center tabular-nums text-[#257844]">
              <MoneyValue value={money(Number(row.sales ?? 0), lang)} />
            </strong>
            <strong className="text-center tabular-nums text-[#B44747]">
              <MoneyValue value={money(Number(row.expense ?? 0), lang)} />
            </strong>
            <NetValue lang={lang} value={row.net} />
          </div>
        ))}
      </div>
      <div className="border-t-2 border-[#112A46]/15 bg-[#F6F8FB] px-3 py-2">
        <div className={`${GRID_CLASS} min-h-[44px] text-taq-meta font-bold`}>
          <span className={`text-[#112A46] ${dayColumnAlignClass(lang)}`}>{text(lang, "combinedTotal")}</span>
          <strong className="text-center tabular-nums text-[#257844]">
            <MoneyValue value={money(totals.sales, lang)} />
          </strong>
          <strong className="text-center tabular-nums text-[#B44747]">
            <MoneyValue value={money(totals.expense, lang)} />
          </strong>
          <div className="text-center">
            <strong className={`tabular-nums ${netPositive ? "text-[#257844]" : "text-[#B44747]"}`}>
              <MoneyValue value={money(totals.net, lang)} />
            </strong>
            {netMarginRatio !== "—" ? (
              <span className="mt-0.5 block text-[9px] font-bold text-[#827762]">
                {netMarginRatio} {text(lang, "netMarginOfSales")}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
