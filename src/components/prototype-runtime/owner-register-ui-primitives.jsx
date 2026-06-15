"use client";

import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { isRegisterIndexTabsEnabled } from "@/core/config/register-dashboard-tabs-mode";
import { money, text } from "./prototype-runtime-demo-data";
import { MoneyValue } from "./prototype-runtime-notebook";

const REGISTER_INDEX_TABS_ENABLED = isRegisterIndexTabsEnabled();

function buildRegisterViewItems(lang, counts) {
  return [
    {
      id: "report",
      label: text(lang, "generalReportTab"),
      count: counts.report ?? 0,
      hideCount: true,
      activeClass: "bg-[#E4B84A] text-[#112A46]",
      inactiveClass: "bg-[#E4B84A]/80 text-[#112A46]",
      badgeActiveClass: "bg-[#112A46] text-white",
      badgeInactiveClass: "bg-[#112A46]/10 text-[#112A46]",
    },
    {
      id: "closeouts",
      label: lang === "ar" ? "التقفيلات" : "Closeouts",
      count: counts.closeouts ?? 0,
      hideCount: false,
      activeClass: "bg-[#214B7B] text-white",
      inactiveClass: "bg-[#214B7B]/82 text-white",
      badgeActiveClass: "bg-white/20 text-white",
      badgeInactiveClass: "bg-white/15 text-white",
    },
    {
      id: "operations",
      label: lang === "ar" ? "العمليات" : "Operations",
      count: counts.operations ?? 0,
      hideCount: false,
      activeClass: "bg-[#257844] text-white",
      inactiveClass: "bg-[#257844]/82 text-white",
      badgeActiveClass: "bg-white/20 text-white",
      badgeInactiveClass: "bg-white/15 text-white",
    },
  ];
}

export function RegisterStoreBadge({ label }) {
  if (!label) return null;
  return (
    <span className="max-w-[9.5rem] truncate rounded-full bg-[#112A46] px-2.5 py-1 text-taq-nav font-black text-white ring-1 ring-[#112A46]/15">
      {label}
    </span>
  );
}

export function LogFilterChip({ active, children, onClick, tone = "default" }) {
  const toneClass = {
    default: active ? "bg-[#112A46] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
    accent: active ? "bg-[#E4B84A] text-[#112A46]" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
    warn: active ? "bg-[#B96725] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
    danger: active ? "bg-[#B44747] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
    navy: active ? "bg-[#214B7B] text-white" : "bg-[#F7F5EF] text-[#716753] ring-1 ring-[#E8E1D4]",
  }[tone];
  return <button type="button" onClick={onClick} className={`rounded-full px-2.5 py-1 text-taq-meta font-black ${toneClass}`}>{children}</button>;
}

export function RegisterViewSwitch({ lang, value, onChange, counts }) {
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

export function RegisterIndexTabs({ lang, value, onChange, counts }) {
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
            } ${active ? "z-10 ring-2 ring-inset ring-[#112A46]" : "opacity-95"} ${
              index > 0 ? "border-s border-white/25" : ""
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

function RegisterFilterToolbar({ lang, showFilters, activeFilterCount, onOpenFilters }) {
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

export function RegisterFilterButton({ lang, activeCount, onClick }) {
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

export function RegisterMetricTile({ label, value, tone = "neutral", emphasize = false }) {
  const tones = {
    neutral: "bg-[#F6F8FB] text-[#112A46]",
    in: "bg-[#EDF7F1] text-[#257844]",
    out: "bg-[#FDF3F1] text-[#B44747]",
  };
  return (
    <div className={`rounded-lg px-2 py-1.5 ${tones[tone] || tones.neutral}`}>
      <p className="text-[9px] font-bold opacity-55">{label}</p>
      <p className={`mt-0.5 tabular-nums font-extrabold leading-none ${emphasize ? "text-sm" : "text-xs"}`}>
        <MoneyValue value={value} />
      </p>
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
  showFilters = true,
}) {
  const netPositive = summary.mode !== "channel" && Number(summary.net) >= 0;
  const useIndexTabs = REGISTER_INDEX_TABS_ENABLED;

  const summaryBody = (
    <>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-[10px] font-bold text-[#827762]">
          <span className="font-black text-[#957D43]">{text(lang, "registerPeriodSummary")}</span>
          {" · "}
          {periodLabel}
        </p>
        {summary.mode !== "channel" ? (
          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black ${
            netPositive ? "bg-[#E6F5E9] text-[#257844]" : "bg-[#FDF0ED] text-[#B44747]"
          }`}
          >
            {netPositive ? (lang === "ar" ? "ربح" : "Profit") : (lang === "ar" ? "خسارة" : "Loss")}
          </span>
        ) : null}
      </div>

      {summary.mode === "channel" ? (
        <div className="flex items-end justify-between gap-2 rounded-lg bg-[#F6F8FB] px-2 py-1.5">
          <p className="truncate text-[10px] font-bold text-[#716753]">{summary.label}</p>
          <p className="shrink-0 tabular-nums text-sm font-extrabold leading-none text-[#257844]">
            <MoneyValue value={money(summary.amount, lang)} />
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          <RegisterMetricTile
            label={lang === "ar" ? "الداخل" : "In"}
            value={money(summary.sales, lang)}
            tone="in"
          />
          <RegisterMetricTile
            label={lang === "ar" ? "الخارج" : "Out"}
            value={money(summary.expense, lang)}
            tone="out"
          />
          <RegisterMetricTile
            label={lang === "ar" ? "الناتج" : "Net"}
            value={money(summary.net, lang)}
            tone={netPositive ? "in" : "out"}
            emphasize
          />
        </div>
      )}
    </>
  );

  if (useIndexTabs) {
    return (
      <article className="mb-3">
        <RegisterIndexTabs lang={lang} value={logView} onChange={setLogView} counts={tabCounts} />
        <div className="overflow-hidden rounded-b-[16px] border border-[#E8E1D4]/90 border-t-0 bg-white shadow-[0_2px_4px_rgba(17,42,70,0.04),0_8px_20px_rgba(17,42,70,0.06)]">
          <RegisterFilterToolbar
            lang={lang}
            showFilters={showFilters}
            activeFilterCount={activeFilterCount}
            onOpenFilters={onOpenFilters}
          />
          <div className="px-3 py-2">
            {summaryBody}
          </div>
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

      <div className="px-3 py-2">
        {summaryBody}
      </div>
    </article>
  );
}
