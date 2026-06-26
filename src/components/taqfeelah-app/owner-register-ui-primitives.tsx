"use client";

import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { isRegisterIndexTabsEnabled } from "@/core/config/register-dashboard-tabs-mode";
import { REGISTER_REPORT_GRANULARITY } from "@/features/reports/client/register-report-granularity";
import { buildIndexTabBorderClass } from "./index-tab-button-styles";
import { money, text } from "./taqfeelah-app-reference-data";
import { MoneyValue } from "./taqfeelah-app-notebook";
import type { DisplayLang, RegisterViewCounts, SettingsTabItem } from "./taqfeelah-app-types";

const REGISTER_INDEX_TABS_ENABLED = isRegisterIndexTabsEnabled();

const REGISTER_VIEW_NEUTRAL_INACTIVE = "bg-[#F0ECE2] text-[#827762]";

function buildRegisterViewItems(lang: DisplayLang, counts: RegisterViewCounts): SettingsTabItem[] {
  return [
    {
      id: "report",
      label: text(lang, "generalReportTab"),
      count: counts.report ?? 0,
      hideCount: true,
      activeClass: "bg-[#E4B84A] text-[#112A46]",
      inactiveClass: `${REGISTER_VIEW_NEUTRAL_INACTIVE} text-[#957D43]/80`,
      badgeActiveClass: "bg-[#112A46] text-white",
      badgeInactiveClass: "bg-[#112A46]/[0.08] text-[#827762]",
      contentSurfaceClass: "bg-[#FFFBF0]",
      contentAccentClass: "border-t-2 border-[#E4B84A]/45",
    },
    {
      id: "closeouts",
      label: lang === "ar" ? "التقفيلات" : "Closeouts",
      count: counts.closeouts ?? 0,
      hideCount: false,
      activeClass: "bg-[#214B7B] text-white",
      inactiveClass: `${REGISTER_VIEW_NEUTRAL_INACTIVE} text-[#214B7B]/75`,
      badgeActiveClass: "bg-white/20 text-white",
      badgeInactiveClass: "bg-[#214B7B]/10 text-[#214B7B]",
      contentSurfaceClass: "bg-[#F5F8FC]",
      contentAccentClass: "border-t-2 border-[#214B7B]/40",
    },
    {
      id: "operations",
      label: lang === "ar" ? "العمليات" : "Operations",
      count: counts.operations ?? 0,
      hideCount: false,
      activeClass: "bg-[#257844] text-white",
      inactiveClass: `${REGISTER_VIEW_NEUTRAL_INACTIVE} text-[#257844]/75`,
      badgeActiveClass: "bg-white/20 text-white",
      badgeInactiveClass: "bg-[#257844]/10 text-[#257844]",
      contentSurfaceClass: "bg-[#F4FAF6]",
      contentAccentClass: "border-t-2 border-[#257844]/40",
    },
    {
      id: "attachments",
      label: text(lang, "attachments"),
      count: counts.attachments ?? 0,
      hideCount: false,
      activeClass: "bg-[#806528] text-white",
      inactiveClass: `${REGISTER_VIEW_NEUTRAL_INACTIVE} text-[#806528]/80`,
      badgeActiveClass: "bg-white/20 text-white",
      badgeInactiveClass: "bg-[#806528]/10 text-[#806528]",
      contentSurfaceClass: "bg-[#FFFBF7]",
      contentAccentClass: "border-t-2 border-[#806528]/40",
    },
  ];
}

function resolveRegisterViewItem(lang: DisplayLang, counts: RegisterViewCounts, viewId: string) {
  const items = buildRegisterViewItems(lang, counts);
  return items.find((item) => item.id === viewId) || items[0];
}

export function RegisterStoreBadge({ label }: { label?: string | null }) {
  if (!label) return null;
  return (
    <span className="max-w-[9.5rem] truncate rounded-full bg-[#112A46] px-2.5 py-1 text-taq-nav font-black text-white ring-1 ring-[#112A46]/15">
      {label}
    </span>
  );
}

export function LogFilterChip({ active, children, onClick, tone = "default" }: { active: boolean; children: React.ReactNode; onClick: () => void; tone?: "default" | "accent" | "warn" | "danger" | "navy" }) {
  const toneClass = {
    default: active ? "bg-[#112A46] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
    accent: active ? "bg-[#E4B84A] text-[#112A46]" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
    warn: active ? "bg-[#B96725] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
    danger: active ? "bg-[#B44747] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
    navy: active ? "bg-[#214B7B] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
  }[tone];
  return <button type="button" onClick={onClick} className={`rounded-full px-2.5 py-1 text-taq-meta font-black ${toneClass}`}>{children}</button>;
}

export function RegisterViewSwitch({ lang, value, onChange, counts }: { lang: DisplayLang; value: string; onChange: (value: string) => void; counts: RegisterViewCounts }) {
  const items = buildRegisterViewItems(lang, counts);

  return (
    <div className="flex rounded-lg bg-[#F3F0E8] p-0.5" role="tablist" aria-label={text(lang, "operationsLog")}>
      {items.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-[9px] px-1.5 py-1.5 text-[10px] font-black transition-all duration-200 ${
              active ? "bg-white text-[#112A46] shadow-[0_1px_6px_rgba(17,42,70,0.07)]" : "text-[#8A8070]"
            }`}
          >
            <span className="truncate">{item.label}</span>
            {!item.hideCount ? (
              <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                active ? "bg-[#112A46] text-white" : "bg-[#112A46]/[0.07] text-[#827762]"
              }`}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function RegisterIndexTabs({ lang, value, onChange, counts }: { lang: DisplayLang; value: string; onChange: (value: string) => void; counts: RegisterViewCounts }) {
  const items = buildRegisterViewItems(lang, counts);

  return (
    <div
      className="flex overflow-hidden rounded-t-[14px] shadow-[0_-1px_0_rgba(17,42,70,0.06)]"
      role="tablist"
      aria-label={text(lang, "operationsLog")}
    >
      {items.map((item, index) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`flex h-9 min-w-0 flex-1 items-center justify-center gap-1 px-1.5 text-[10px] font-black transition-all duration-200 ${
              active ? item.activeClass : item.inactiveClass
            } ${buildIndexTabBorderClass(index, items.length, active)} ${
              index > 0 ? "border-s border-[#E8E1D4]/80" : ""
            }`}
          >
            <span className="truncate leading-4">{item.label}</span>
            {!item.hideCount ? (
              <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold tabular-nums ${
                active ? item.badgeActiveClass : item.badgeInactiveClass
              }`}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function RegisterFilterToolbar({ lang, showFilters, activeFilterCount, onOpenFilters }: { lang: DisplayLang; showFilters: boolean; activeFilterCount: number; onOpenFilters: () => void }) {
  return (
    <div className="flex h-12 shrink-0 items-center border-b border-[#F0EBE0] px-3">
      {showFilters ? (
        <RegisterFilterButton lang={lang} activeCount={activeFilterCount} onClick={onOpenFilters} />
      ) : (
        <span className="inline-flex h-8 w-8 shrink-0" aria-hidden="true" />
      )}
    </div>
  );
}

export function RegisterFilterButton({ lang, activeCount, onClick }: { lang: DisplayLang; activeCount: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={text(lang, "logFilters")}
      className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 ${
        activeCount > 0
          ? "bg-[#112A46] text-white shadow-[0_1px_6px_rgba(17,42,70,0.18)]"
          : "bg-white text-[#112A46] ring-1 ring-[#E8E1D4]"
      }`}
    >
      <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2.25} />
      {activeCount > 0 ? (
        <span className="absolute -end-1 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[#E4B84A] px-0.5 text-[8px] font-black text-[#112A46] ring-1 ring-white">
          {activeCount}
        </span>
      ) : null}
    </button>
  );
}

export function RegisterMetricTile({ label, value, tone = "neutral", size = "md" }: { label: React.ReactNode; value: string; tone?: "neutral" | "in" | "out"; size?: "sm" | "md" | "lg" }) {
  const valueTone = {
    neutral: "text-[#112A46]",
    in: "text-[#257844]",
    out: "text-[#B44747]",
  }[tone] || "text-[#112A46]";

  const valueSize = size === "lg" ? "text-lg" : size === "sm" ? "text-xs" : "text-base";

  return (
    <div className="min-w-0 px-1 text-center">
      <p className="text-[9px] font-bold text-[#A99D87]">{label}</p>
      <p className={`mt-1.5 tabular-nums font-black leading-none ${valueTone} ${valueSize}`}>
        <MoneyValue value={value} />
      </p>
    </div>
  );
}

function RegisterPeriodSummary({
  lang,
  periodLabel,
  summary,
}: {
  lang: DisplayLang;
  periodLabel: string;
  summary: Record<string, unknown> & { mode?: string; net?: number; label?: string; amount?: number; sales?: number; expense?: number };
}) {
  const netPositive = summary.mode !== "channel" && Number(summary.net) >= 0;

  if (summary.mode === "channel") {
    return (
      <div className="rounded-2xl bg-gradient-to-b from-white to-[#FDFBF7] px-4 py-3 ring-1 ring-[#ECE6DA]/90">
        <p className="text-center text-[10px] font-bold text-[#A99D87]">{periodLabel}</p>
        <div className="mt-3 flex items-end justify-between gap-3 border-t border-[#F0EBE0] pt-3">
          <p className="min-w-0 truncate text-[11px] font-bold text-[#716753]">{summary.label}</p>
          <p className="shrink-0 tabular-nums text-lg font-black leading-none text-[#257844]">
            <MoneyValue value={money(Number(summary.amount ?? 0), lang)} />
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-b from-white to-[#FDFBF7] px-3 py-3 ring-1 ring-[#ECE6DA]/90">
      <p className="text-center text-[10px] font-bold text-[#A99D87]">{periodLabel}</p>
      <div className="mt-3 grid grid-cols-3 divide-x divide-[#E8E1D4]/80">
        <RegisterMetricTile
          label={lang === "ar" ? "الداخل" : "In"}
          value={money(Number(summary.sales ?? 0), lang)}
          tone="in"
          size="lg"
        />
        <RegisterMetricTile
          label={lang === "ar" ? "الخارج" : "Out"}
          value={money(Number(summary.expense ?? 0), lang)}
          tone="out"
          size="lg"
        />
        <div className="min-w-0 px-1 text-center">
          <p className="text-[9px] font-bold text-[#A99D87]">{lang === "ar" ? "الناتج" : "Net"}</p>
          <p className={`mt-1.5 tabular-nums text-lg font-black leading-none ${netPositive ? "text-[#257844]" : "text-[#B44747]"}`}>
            <MoneyValue value={money(Number(summary.net ?? 0), lang)} />
          </p>
        </div>
      </div>
    </div>
  );
}

export function RegisterDashboardCard({
  lang,
  logView,
  setLogView,
  tabCounts,
  activeFilterCount,
  onOpenFilters,
  periodLabel,
  summary,
  summaryLoading = false,
  summaryErrorMessage = "",
  showFilters = true,
}: {
  lang: DisplayLang;
  logView: string;
  setLogView: (value: string) => void;
  tabCounts: RegisterViewCounts;
  activeFilterCount: number;
  onOpenFilters: () => void;
  periodLabel: string;
  summary: Record<string, unknown>;
  summaryLoading?: boolean;
  summaryErrorMessage?: string;
  showFilters?: boolean;
}) {
  const useIndexTabs = REGISTER_INDEX_TABS_ENABLED;
  const activeView = resolveRegisterViewItem(lang, tabCounts, logView);

  const summaryBody = summaryLoading ? (
    <div className="rounded-2xl bg-gradient-to-b from-white to-[#FDFBF7] px-4 py-5 text-center ring-1 ring-[#ECE6DA]/90">
      <p className="text-[10px] font-bold text-[#A99D87]">{periodLabel}</p>
      <p className="mt-2 text-xs font-black text-[#112A46]">{lang === "ar" ? "جاري تحميل الأرقام من الخادم..." : "Loading figures from the server..."}</p>
    </div>
  ) : summaryErrorMessage ? (
    <div className="rounded-2xl bg-[#FFF7F5] px-4 py-5 text-center ring-1 ring-[#F0C7C1]">
      <p className="text-xs font-black text-[#B44747]">{summaryErrorMessage}</p>
    </div>
  ) : (
    <RegisterPeriodSummary
      lang={lang}
      periodLabel={periodLabel}
      summary={summary}
    />
  );

  const cardBody = (
    <div className={`${activeView.contentSurfaceClass} ${activeView.contentAccentClass}`}>
      <RegisterFilterToolbar
        lang={lang}
        showFilters={showFilters}
        activeFilterCount={activeFilterCount}
        onOpenFilters={onOpenFilters}
      />
      <div className="px-3 pb-2.5 pt-1">
        {summaryBody}
      </div>
    </div>
  );

  if (useIndexTabs) {
    return (
      <article className="mb-3">
        <RegisterIndexTabs lang={lang} value={logView} onChange={setLogView} counts={tabCounts} />
        <div className="overflow-hidden rounded-b-[16px] border border-[#E8E1D4]/90 border-t-0 bg-white shadow-[0_2px_4px_rgba(17,42,70,0.04),0_8px_20px_rgba(17,42,70,0.06)]">
          {cardBody}
        </div>
      </article>
    );
  }

  return (
    <article className="mb-3 overflow-hidden rounded-[16px] border border-[#E8E1D4]/90 bg-white shadow-[0_2px_4px_rgba(17,42,70,0.04),0_8px_20px_rgba(17,42,70,0.06)]">
      <div className="border-b border-[#F0EBE0] px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="min-w-0 flex-1">
            <RegisterViewSwitch lang={lang} value={logView} onChange={setLogView} counts={tabCounts} />
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center">
            {showFilters ? (
              <RegisterFilterButton lang={lang} activeCount={activeFilterCount} onClick={onOpenFilters} />
            ) : (
              <span className="inline-flex h-8 w-8 shrink-0" aria-hidden="true" />
            )}
          </div>
        </div>
      </div>

      <div className={`px-3 py-2 ${activeView.contentSurfaceClass}`}>
        {summaryBody}
      </div>
    </article>
  );
}

export function OwnerRegisterReportGranularityToggle({ lang, value, onChange }: { lang: DisplayLang; value: string; onChange: (value: string) => void }) {
  return (
    <div
      className="mb-3 flex items-center justify-end gap-1.5"
      role="group"
      aria-label={lang === "ar" ? "تجميع التقرير" : "Report grouping"}
    >
      <LogFilterChip
        active={value === REGISTER_REPORT_GRANULARITY.MONTH}
        onClick={() => onChange(REGISTER_REPORT_GRANULARITY.MONTH)}
        tone="accent"
      >
        {text(lang, "reportGranularityMonthly")}
      </LogFilterChip>
      <LogFilterChip
        active={value === REGISTER_REPORT_GRANULARITY.DAY}
        onClick={() => onChange(REGISTER_REPORT_GRANULARITY.DAY)}
        tone="navy"
      >
        {text(lang, "reportGranularityDaily")}
      </LogFilterChip>
    </div>
  );
}
