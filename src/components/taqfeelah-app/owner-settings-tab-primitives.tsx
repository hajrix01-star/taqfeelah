"use client";

import React from "react";
import { buildIndexTabBorderClass } from "./index-tab-button-styles";
import type { DisplayLang, SettingsTabCounts, SettingsTabItem } from "./taqfeelah-app-types";

const SETTINGS_TAB_NEUTRAL_INACTIVE = "bg-[var(--taq-color-f0ece2)] text-[var(--taq-color-827762)]";

function buildTabButtonClass(
  item: SettingsTabItem,
  active: boolean,
  { sub = false, index = 0, total = 1 }: { sub?: boolean; index?: number; total?: number },
) {
  const height = sub ? "h-8" : "h-9";
  const textSize = sub ? "text-[9px]" : "text-[10px]";
  return `flex ${height} min-w-0 flex-1 items-center justify-center gap-1 px-1.5 ${textSize} font-black transition-all duration-200 ${
    active ? item.activeClass : item.inactiveClass
  } ${buildIndexTabBorderClass(index, total, active, { tier: sub ? "sub" : "main" })}`;
}

function SettingsTabList({
  items,
  value,
  onChange,
  ariaLabel,
  sub = false,
  integrated = false,
}: {
  items: SettingsTabItem[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  sub?: boolean;
  integrated?: boolean;
}) {
  const rounding = integrated
    ? ""
    : sub
      ? "rounded-t-[12px]"
      : "rounded-t-[14px]";
  const shadow = integrated && sub ? "" : "shadow-[0_-1px_0_rgba(17,42,70,0.06)]";
  const border = integrated && sub ? "border-t border-[var(--taq-color-e8e1d4)]/80" : "";

  return (
    <div
      className={`flex overflow-hidden ${rounding} ${shadow} ${border}`}
      role="tablist"
      aria-label={ariaLabel}
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
            className={`${buildTabButtonClass(item, active, { sub, index, total: items.length })} ${
              index > 0 ? "border-s border-[var(--taq-color-e8e1d4)]/80" : ""
            }`}
          >
            <span className="truncate leading-4">{item.label}</span>
            {!item.hideCount ? (
              <span
                className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold tabular-nums ${
                  active ? item.badgeActiveClass : item.badgeInactiveClass
                }`}
              >
                {item.count ?? 0}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function buildSettingsMainTabItems(lang: DisplayLang): SettingsTabItem[] {
  return [
    {
      id: "stores-team",
      label: lang === "ar" ? "محلات وفريق" : "Shops & team",
      hideCount: true,
      activeClass: "bg-[var(--taq-color-214b7b)] text-white",
      inactiveClass: `${SETTINGS_TAB_NEUTRAL_INACTIVE} text-[var(--taq-color-214b7b)]/75`,
      contentSurfaceClass: "bg-[var(--taq-color-f5f8fc)]",
      contentAccentClass: "border-t-2 border-[var(--taq-color-214b7b)]/40",
    },
    {
      id: "account",
      label: lang === "ar" ? "حسابي" : "Account",
      hideCount: true,
      activeClass: "bg-[var(--taq-color-112a46)] text-white",
      inactiveClass: `${SETTINGS_TAB_NEUTRAL_INACTIVE} text-[var(--taq-color-112a46)]/75`,
      contentSurfaceClass: "bg-[var(--taq-color-f7f9fc)]",
      contentAccentClass: "border-t-2 border-[var(--taq-color-112a46)]/35",
    },
    {
      id: "shape",
      label: lang === "ar" ? "الشكل" : "Look",
      hideCount: true,
      activeClass: "bg-[var(--taq-color-e4b84a)] text-[var(--taq-color-112a46)]",
      inactiveClass: `${SETTINGS_TAB_NEUTRAL_INACTIVE} text-[var(--taq-color-957d43)]/80`,
      contentSurfaceClass: "bg-[var(--taq-color-fffbf0)]",
      contentAccentClass: "border-t-2 border-[var(--taq-color-e4b84a)]/45",
    },
    {
      id: "help",
      label: lang === "ar" ? "المساعدة" : "Help",
      hideCount: true,
      activeClass: "bg-[var(--taq-color-806528)] text-white",
      inactiveClass: `${SETTINGS_TAB_NEUTRAL_INACTIVE} text-[var(--taq-color-806528)]/75`,
      contentSurfaceClass: "bg-[var(--taq-color-faf7f0)]",
      contentAccentClass: "border-t-2 border-[var(--taq-color-806528)]/40",
    },
  ];
}

export function buildSettingsOrgSubTabItems(lang: DisplayLang, counts: SettingsTabCounts = {}): SettingsTabItem[] {
  return [
    {
      id: "stores",
      label: lang === "ar" ? "محلات" : "Stores",
      count: counts.stores ?? 0,
      activeClass: "bg-[var(--taq-color-214b7b)] text-white",
      inactiveClass: `${SETTINGS_TAB_NEUTRAL_INACTIVE} text-[var(--taq-color-214b7b)]/75`,
      badgeActiveClass: "bg-white/20 text-white",
      badgeInactiveClass: "bg-[var(--taq-color-214b7b)]/10 text-[var(--taq-color-214b7b)]",
      contentSurfaceClass: "bg-[var(--taq-color-f5f8fc)]",
      contentAccentClass: "border-t-2 border-[var(--taq-color-214b7b)]/40",
    },
    {
      id: "team",
      label: lang === "ar" ? "فريق" : "Team",
      count: counts.team ?? 0,
      activeClass: "bg-[var(--taq-color-257844)] text-white",
      inactiveClass: `${SETTINGS_TAB_NEUTRAL_INACTIVE} text-[var(--taq-color-257844)]/75`,
      badgeActiveClass: "bg-white/20 text-white",
      badgeInactiveClass: "bg-[var(--taq-color-257844)]/10 text-[var(--taq-color-257844)]",
      contentSurfaceClass: "bg-[var(--taq-color-f4faf6)]",
      contentAccentClass: "border-t-2 border-[var(--taq-color-257844)]/40",
    },
  ];
}

export function buildSettingsStoreSubTabItems(lang: DisplayLang): SettingsTabItem[] {
  return [
    {
      id: "profile",
      label: lang === "ar" ? "بيانات" : "Details",
      hideCount: true,
      activeClass: "bg-[var(--taq-color-257844)] text-white",
      inactiveClass: `${SETTINGS_TAB_NEUTRAL_INACTIVE} text-[var(--taq-color-257844)]/75`,
      contentSurfaceClass: "bg-[var(--taq-color-f4faf6)]",
      contentAccentClass: "border-t-2 border-[var(--taq-color-257844)]/40",
    },
    {
      id: "channels",
      label: lang === "ar" ? "دفع" : "Payment",
      hideCount: true,
      activeClass: "bg-[var(--taq-color-214b7b)] text-white",
      inactiveClass: `${SETTINGS_TAB_NEUTRAL_INACTIVE} text-[var(--taq-color-214b7b)]/75`,
      contentSurfaceClass: "bg-[var(--taq-color-f5f8fc)]",
      contentAccentClass: "border-t-2 border-[var(--taq-color-214b7b)]/40",
    },
    {
      id: "expenses",
      label: lang === "ar" ? "مصروفات" : "Expenses",
      hideCount: true,
      activeClass: "bg-[var(--taq-color-b96725)] text-white",
      inactiveClass: `${SETTINGS_TAB_NEUTRAL_INACTIVE} text-[var(--taq-color-b96725)]/80`,
      contentSurfaceClass: "bg-[var(--taq-color-fff8f2)]",
      contentAccentClass: "border-t-2 border-[var(--taq-color-b96725)]/35",
    },
    {
      id: "operations",
      label: lang === "ar" ? "تشغيل" : "Ops",
      hideCount: true,
      activeClass: "bg-[var(--taq-color-112a46)] text-white",
      inactiveClass: `${SETTINGS_TAB_NEUTRAL_INACTIVE} text-[var(--taq-color-112a46)]/75`,
      contentSurfaceClass: "bg-[var(--taq-color-f7f9fc)]",
      contentAccentClass: "border-t-2 border-[var(--taq-color-112a46)]/35",
    },
  ];
}

export function resolveSettingsMainTabItem(lang: DisplayLang, mainTab: string) {
  return buildSettingsMainTabItems(lang).find((item) => item.id === mainTab)
    || buildSettingsMainTabItems(lang)[0];
}

export function resolveSettingsOrgSubTabItem(lang: DisplayLang, counts: SettingsTabCounts, subTab: string) {
  const items = buildSettingsOrgSubTabItems(lang, counts);
  return items.find((item) => item.id === subTab) || items[0];
}

export function resolveSettingsStoreSubTabItem(lang: DisplayLang, panel: string) {
  const items = buildSettingsStoreSubTabItems(lang);
  const normalized = panel === "overview" ? "profile" : panel;
  return items.find((item) => item.id === normalized) || items[0];
}

export function SettingsMainTabs({
  lang,
  value,
  onChange,
  ariaLabel,
  integrated = false,
}: {
  lang: DisplayLang;
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  integrated?: boolean;
}) {
  return (
    <SettingsTabList
      items={buildSettingsMainTabItems(lang)}
      value={value}
      onChange={onChange}
      ariaLabel={ariaLabel}
      integrated={integrated}
    />
  );
}

export function SettingsOrgSubTabs({
  lang,
  value,
  onChange,
  counts,
  ariaLabel,
  integrated = false,
}: {
  lang: DisplayLang;
  value: string;
  onChange: (value: string) => void;
  counts: SettingsTabCounts;
  ariaLabel: string;
  integrated?: boolean;
}) {
  return (
    <SettingsTabList
      items={buildSettingsOrgSubTabItems(lang, counts)}
      value={value}
      onChange={onChange}
      ariaLabel={ariaLabel}
      sub
      integrated={integrated}
    />
  );
}

export function SettingsStoreSubTabs({
  lang,
  value,
  onChange,
  ariaLabel,
  integrated = true,
}: {
  lang: DisplayLang;
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  integrated?: boolean;
}) {
  const normalized = value === "overview" ? "profile" : value;
  return (
    <SettingsTabList
      items={buildSettingsStoreSubTabItems(lang)}
      value={normalized}
      onChange={onChange}
      ariaLabel={ariaLabel}
      sub={!integrated}
      integrated={integrated}
    />
  );
}

export function SettingsTabContentCard({ surfaceClass, accentClass, children, className = "" }: { surfaceClass: string; accentClass: string; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-b-[16px] border border-[var(--taq-color-e8e1d4)]/90 border-t-0 px-3 py-3 shadow-[0_2px_4px_rgba(17,42,70,0.04),0_8px_20px_rgba(17,42,70,0.06)] ${surfaceClass} ${accentClass} ${className}`}
    >
      {children}
    </div>
  );
}

export function SettingsTabbedPanel({
  sticky = false,
  className = "",
  tabs,
  subTabs = null,
  surfaceClass,
  accentClass,
  children,
}: {
  sticky?: boolean;
  className?: string;
  tabs: React.ReactNode;
  subTabs?: React.ReactNode | null;
  surfaceClass: string;
  accentClass: string;
  children: React.ReactNode;
}) {
  const stickyClass = sticky
    ? "sticky top-0 z-20 -mx-1 bg-[var(--taq-color-f8f6f0)]/95 px-1 pb-0 pt-0.5 backdrop-blur-sm supports-[backdrop-filter]:bg-[var(--taq-color-f8f6f0)]/88"
    : "";

  return (
    <article className={`mb-3 ${className}`}>
      <div className={stickyClass}>
        <div className="overflow-hidden rounded-t-[14px] border border-b-0 border-[var(--taq-color-e8e1d4)]/90 shadow-[0_-1px_0_rgba(17,42,70,0.06)]">
          {tabs}
          {subTabs}
        </div>
      </div>
      <SettingsTabContentCard surfaceClass={surfaceClass} accentClass={accentClass}>
        {children}
      </SettingsTabContentCard>
    </article>
  );
}
