"use client";

import React from "react";
import {
  aggregateChannels,
  entriesInPeriod,
  summaryDayFromEntries,
  summaryMonthFromEntries,
} from "@/features/operations/operational-analytics";
import {
  buildOutflowByCategoryFromEntries,
  percentageOfSalesAmount,
} from "@/features/reports/client/operational-reports-display";
import { formatCalendarDate } from "@/features/reports/client/report-period-labels";
import type { FormatDayLabelFn } from "@/features/operations/operations-types";
import {
  channelName,
  channels,
  money,
  outflowReportCategories,
  text,
} from "./prototype-runtime-demo-data";
import { entryCategory } from "./prototype-runtime-entry-helpers";
import { NotebookRow, MoneyValue } from "./prototype-runtime-notebook";
import type {
  OperationalEntry,
  PrototypeBusiness,
  PrototypeChannel,
  PrototypeLang,
  PrototypeOutflowCategory,
} from "./prototype-runtime-types";

function summaryDayFromEntriesWithLabels(
  entries: OperationalEntry[],
  businessId: string,
  date: string,
) {
  return summaryDayFromEntries(entries, businessId, date, formatCalendarDate as FormatDayLabelFn);
}

export function RatioBadge({ value }: { value: string }) {
  return <span className="rounded-full bg-[#E6EFEF] px-1.5 py-0.5 text-taq-nav font-bold tabular-nums text-[#316C73]">{value}</span>;
}

type SummaryReportDetailsProps = {
  lang: PrototypeLang;
  monthly: boolean;
  selectedBusiness: string;
  selectedDate: string;
  selectedMonth: string;
  reportChannels?: PrototypeChannel[];
  businessesList?: PrototypeBusiness[];
  section?: "sales" | "outflow" | "both";
  operationalEntries?: OperationalEntry[];
  apiChannelRows?: Array<{ id: string; amount: number }> | null;
  apiOutflowCategories?: Array<{ id: string; amount: number }> | null;
  salesBaseOverride?: number | null;
};

export function SummaryReportDetails({
  lang,
  monthly,
  selectedBusiness,
  selectedDate,
  selectedMonth,
  reportChannels = channels,
  businessesList = [],
  section = "both",
  operationalEntries = [],
  apiChannelRows = null,
  apiOutflowCategories = null,
  salesBaseOverride = null,
}: SummaryReportDetailsProps) {
  const salesBase = typeof salesBaseOverride === "number"
    ? salesBaseOverride
    : (monthly
      ? summaryMonthFromEntries(operationalEntries, selectedBusiness, selectedMonth)
      : summaryDayFromEntriesWithLabels(operationalEntries, selectedBusiness, selectedDate)).sales;
  const periodEntries = entriesInPeriod(operationalEntries, selectedBusiness, monthly ? "month" : "day", selectedDate, selectedMonth);
  type ChannelSummaryRow = { id: string; amount: number; [key: string]: unknown };
  const dynamicChannels: ChannelSummaryRow[] = Array.isArray(apiChannelRows)
    ? apiChannelRows.map((row) => ({ ...row, id: String(row.id), amount: Number(row.amount || 0) }))
    : (aggregateChannels(
      operationalEntries,
      selectedBusiness,
      monthly ? "month" : "day",
      selectedDate,
      selectedMonth,
      reportChannels as Array<{ id: string; amount?: number }>,
    ) as ChannelSummaryRow[]);
  const outflowByCategory = Array.isArray(apiOutflowCategories)
    ? apiOutflowCategories.map((item) => ({
      ...(outflowReportCategories.find((category) => category.id === item.id) || { id: item.id, label: item.id }),
      amount: item.amount,
    })).filter((item) => (item.amount ?? 0) > 0)
    : buildOutflowByCategoryFromEntries(
      periodEntries,
      outflowReportCategories as Array<{ id: string; label: string }>,
      entryCategory,
    );
  const percentageOfSales = (amount: number) => percentageOfSalesAmount(amount, salesBase);
  return (
    <>
      {(section === "sales" || section === "both") && dynamicChannels.map((channel) => (
        <NotebookRow key={channel.id}>
          <div className="flex w-full items-end justify-between ps-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#716753]">{channelName(channel, lang)}</span>
              <RatioBadge value={percentageOfSales(channel.amount)} />
            </div>
            <strong className="tabular-nums font-bold text-[#112A46]">
              <MoneyValue value={money(channel.amount, lang)} />
            </strong>
          </div>
        </NotebookRow>
      ))}
      {(section === "outflow" || section === "both") && (outflowByCategory as Array<{ id: string; label: string; amount?: number }>).map((item) => (
        <NotebookRow key={String(item.id)}>
          <div className="flex w-full items-end justify-between ps-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#716753]">{text(lang, item.label)}</span>
              <RatioBadge value={percentageOfSales(item.amount ?? 0)} />
            </div>
            <strong className="tabular-nums font-bold text-[#B44747]">
              <MoneyValue value={money(item.amount ?? 0, lang)} />
            </strong>
          </div>
        </NotebookRow>
      ))}
    </>
  );
}
