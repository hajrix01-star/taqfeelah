"use client";

import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { isRegisterIndexTabsEnabled } from "@/core/config/register-dashboard-tabs-mode";
import { REGISTER_REPORT_GRANULARITY } from "@/features/reports/client/register-report-granularity";
import { buildIndexTabBorderClass } from "./index-tab-button-styles";
import { taqUi } from "./taq-ui-classes";
import { money, text } from "./taqfeelah-app-catalog-data";
import { MoneyValue } from "./taqfeelah-app-notebook";
import type { DisplayLang, RegisterViewCounts, SettingsTabItem } from "./taqfeelah-app-types";

const REGISTER_INDEX_TABS_ENABLED = isRegisterIndexTabsEnabled();

const REGISTER_VIEW_NEUTRAL_INACTIVE = `${taqUi.bg.inactive} ${taqUi.text.subtle}`;

function buildRegisterViewItems(lang: DisplayLang, counts: RegisterViewCounts): SettingsTabItem[] {
  return [
    {
      id: "report",
      label: text(lang, "generalReportTab"),
      count: counts.report ?? 0,
      hideCount: true,
      activeClass: `${taqUi.bg.accent} ${taqUi.text.primary}`,
      inactiveClass: `${REGISTER_VIEW_NEUTRAL_INACTIVE} text-[var(--taq-color-957d43)]/80`,
      badgeActiveClass: `${taqUi.bg.primary} text-white`,
      badgeInactiveClass: "bg-[var(--taq-color-112a46)]/[0.08] text-[var(--taq-color-827762)]",
      contentSurfaceClass: "bg-[var(--taq-color-fffbf0)]",
      contentAccentClass: "border-t-2 border-[var(--taq-color-e4b84a)]/45",
    },
    {
      id: "closeouts",
      label: lang === "ar" ? "التقفيلات" : "Closeouts",
      count: counts.closeouts ?? 0,
      hideCount: false,
      activeClass: `${taqUi.bg.blue} text-white`,
      inactiveClass: `${REGISTER_VIEW_NEUTRAL_INACTIVE} text-[var(--taq-color-214b7b)]/75`,
      badgeActiveClass: "bg-white/20 text-white",
      badgeInactiveClass: "bg-[var(--taq-color-214b7b)]/10 text-[var(--taq-color-214b7b)]",
      contentSurfaceClass: "bg-[var(--taq-color-f5f8fc)]",
      contentAccentClass: "border-t-2 border-[var(--taq-color-214b7b)]/40",
    },
    {
      id: "operations",
      label: lang === "ar" ? "العمليات" : "Operations",
      count: counts.operations ?? 0,
      hideCount: false,
      activeClass: `${taqUi.bg.success} text-white`,
      inactiveClass: `${REGISTER_VIEW_NEUTRAL_INACTIVE} text-[var(--taq-color-257844)]/75`,
      badgeActiveClass: "bg-white/20 text-white",
      badgeInactiveClass: "bg-[var(--taq-color-257844)]/10 text-[var(--taq-color-257844)]",
      contentSurfaceClass: "bg-[var(--taq-color-f4faf6)]",
      contentAccentClass: "border-t-2 border-[var(--taq-color-257844)]/40",
    },
    {
      id: "attachments",
      label: text(lang, "attachments"),
      count: counts.attachments ?? 0,
      hideCount: false,
      activeClass: `${taqUi.bg.amber} text-white`,
      inactiveClass: `${REGISTER_VIEW_NEUTRAL_INACTIVE} text-[var(--taq-color-806528)]/80`,
      badgeActiveClass: "bg-white/20 text-white",
      badgeInactiveClass: "bg-[var(--taq-color-806528)]/10 text-[var(--taq-color-806528)]",
      contentSurfaceClass: "bg-[var(--taq-color-fffbf7)]",
      contentAccentClass: "border-t-2 border-[var(--taq-color-806528)]/40",
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
    <span className={`max-w-[9.5rem] truncate rounded-full ${taqUi.bg.primary} px-2.5 py-1 text-taq-nav font-black text-white ring-1 ring-[var(--taq-color-112a46)]/15`}>
      {label}
    </span>
  );
}

export function LogFilterChip({ active, children, onClick, tone = "default" }: { active: boolean; children: React.ReactNode; onClick: () => void; tone?: "default" | "accent" | "warn" | "danger" | "navy" }) {
  const toneClass = {
    default: active ? `${taqUi.bg.primary} text-white` : `${taqUi.bg.paper} ${taqUi.text.muted} ${taqUi.ring.line}`,
    accent: active ? `${taqUi.bg.accent} ${taqUi.text.primary}` : `${taqUi.bg.paper} ${taqUi.text.muted} ${taqUi.ring.line}`,
    warn: active ? "bg-[var(--taq-color-b96725)] text-white" : "bg-[var(--taq-color-f7f5ef)] text-[var(--taq-color-716753)] ring-1 ring-[var(--taq-color-e8e1d4)]",
    danger: active ? `${taqUi.bg.danger} text-white` : `${taqUi.bg.paper} ${taqUi.text.muted} ${taqUi.ring.line}`,
    navy: active ? `${taqUi.bg.blue} text-white` : `${taqUi.bg.paper} ${taqUi.text.muted} ${taqUi.ring.line}`,
  }[tone];
  return <button type="button" onClick={onClick} className={`rounded-full px-2.5 py-1 text-taq-meta font-black ${toneClass}`}>{children}</button>;
}

export function RegisterViewSwitch({ lang, value, onChange, counts }: { lang: DisplayLang; value: string; onChange: (value: string) => void; counts: RegisterViewCounts }) {
  const items = buildRegisterViewItems(lang, counts);

  return (
    <div className={`flex rounded-lg ${taqUi.bg.softPaper} p-0.5`} role="tablist" aria-label={text(lang, "operationsLog")}>
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
              active ? `${taqUi.bg.white} ${taqUi.text.primary} ${taqUi.shadow.soft}` : "text-[var(--taq-color-8a8070)]"
            }`}
          >
            <span className="truncate">{item.label}</span>
            {!item.hideCount ? (
              <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                active ? "bg-[var(--taq-color-112a46)] text-white" : "bg-[var(--taq-color-112a46)]/[0.07] text-[var(--taq-color-827762)]"
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
              index > 0 ? "border-s border-[var(--taq-color-e8e1d4)]/80" : ""
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
    <div className={`flex h-12 shrink-0 items-center border-b ${taqUi.border.soft} px-3`}>
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
          ? `${taqUi.bg.primary} text-white ${taqUi.shadow.active}`
          : `${taqUi.bg.white} ${taqUi.text.primary} ${taqUi.ring.line}`
      }`}
    >
      <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2.25} />
      {activeCount > 0 ? (
        <span className="absolute -end-1 -top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-[var(--taq-color-e4b84a)] px-0.5 text-[8px] font-black text-[var(--taq-color-112a46)] ring-1 ring-white">
          {activeCount}
        </span>
      ) : null}
    </button>
  );
}

export function RegisterMetricTile({ label, value, tone = "neutral", size = "md" }: { label: React.ReactNode; value: string; tone?: "neutral" | "in" | "out"; size?: "sm" | "md" | "lg" }) {
  const valueTone = {
    neutral: taqUi.text.primary,
    in: taqUi.text.success,
    out: taqUi.text.danger,
  }[tone] || taqUi.text.primary;

  const valueSize = size === "lg" ? "text-lg" : size === "sm" ? "text-xs" : "text-base";

  return (
    <div className="min-w-0 px-1 text-center">
      <p className={`text-[9px] font-bold ${taqUi.text.meta}`}>{label}</p>
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
      <div className="rounded-2xl bg-gradient-to-b from-white to-[var(--taq-color-fdfbf7)] px-4 py-3 ring-1 ring-[var(--taq-color-ece6da)]/90">
        <p className="text-center text-[10px] font-bold text-[var(--taq-color-a99d87)]">{periodLabel}</p>
        <div className="mt-3 flex items-end justify-between gap-3 border-t border-[var(--taq-color-f0ebe0)] pt-3">
          <p className="min-w-0 truncate text-[11px] font-bold text-[var(--taq-color-716753)]">{summary.label}</p>
          <p className="shrink-0 tabular-nums text-lg font-black leading-none text-[var(--taq-color-257844)]">
            <MoneyValue value={money(Number(summary.amount ?? 0), lang)} />
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-b from-white to-[var(--taq-color-fdfbf7)] px-3 py-3 ring-1 ring-[var(--taq-color-ece6da)]/90">
      <p className="text-center text-[10px] font-bold text-[var(--taq-color-a99d87)]">{periodLabel}</p>
      <div className="mt-3 grid grid-cols-3 divide-x divide-[var(--taq-color-e8e1d4)]/80">
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
          <p className="text-[9px] font-bold text-[var(--taq-color-a99d87)]">{lang === "ar" ? "الناتج" : "Net"}</p>
          <p className={`mt-1.5 tabular-nums text-lg font-black leading-none ${netPositive ? "text-[var(--taq-color-257844)]" : "text-[var(--taq-color-b44747)]"}`}>
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
    <div className="rounded-2xl bg-gradient-to-b from-white to-[var(--taq-color-fdfbf7)] px-4 py-5 text-center ring-1 ring-[var(--taq-color-ece6da)]/90">
      <p className="text-[10px] font-bold text-[var(--taq-color-a99d87)]">{periodLabel}</p>
      <p className="mt-2 text-xs font-black text-[var(--taq-color-112a46)]">{lang === "ar" ? "جاري تحميل الأرقام من الخادم..." : "Loading figures from the server..."}</p>
    </div>
  ) : summaryErrorMessage ? (
    <div className="rounded-2xl bg-[var(--taq-color-fff7f5)] px-4 py-5 text-center ring-1 ring-[var(--taq-color-f0c7c1)]">
      <p className="text-xs font-black text-[var(--taq-color-b44747)]">{summaryErrorMessage}</p>
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
        <div className="overflow-hidden rounded-b-[16px] border border-[var(--taq-color-e8e1d4)]/90 border-t-0 bg-white shadow-[0_2px_4px_rgba(17,42,70,0.04),0_8px_20px_rgba(17,42,70,0.06)]">
          {cardBody}
        </div>
      </article>
    );
  }

  return (
    <article className="mb-3 overflow-hidden rounded-[16px] border border-[var(--taq-color-e8e1d4)]/90 bg-white shadow-[0_2px_4px_rgba(17,42,70,0.04),0_8px_20px_rgba(17,42,70,0.06)]">
      <div className="border-b border-[var(--taq-color-f0ebe0)] px-3 py-2">
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
