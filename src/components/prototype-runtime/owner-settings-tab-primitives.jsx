"use client";

import React from "react";
import { buildIndexTabBorderClass } from "./index-tab-button-styles";

const SETTINGS_TAB_NEUTRAL_INACTIVE = "bg-[#F0ECE2] text-[#827762]";

function buildTabButtonClass(item, active, { sub = false, index = 0, total = 1 }) {
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
}) {
  const rounding = integrated
    ? ""
    : sub
      ? "rounded-t-[12px]"
      : "rounded-t-[14px]";
  const shadow = integrated && sub ? "" : "shadow-[0_-1px_0_rgba(17,42,70,0.06)]";
  const border = integrated && sub ? "border-t border-[#E8E1D4]/80" : "";

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
              index > 0 ? "border-s border-[#E8E1D4]/80" : ""
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

export function buildSettingsMainTabItems(lang) {
  return [
    {
      id: "organization",
      label: lang === "ar" ? "المنشأة" : "Organization",
      hideCount: true,
      activeClass: "bg-[#214B7B] text-white",
      inactiveClass: `${SETTINGS_TAB_NEUTRAL_INACTIVE} text-[#214B7B]/75`,
      contentSurfaceClass: "bg-[#F5F8FC]",
      contentAccentClass: "border-t-2 border-[#214B7B]/40",
    },
    {
      id: "account",
      label: lang === "ar" ? "حسابي" : "Account",
      hideCount: true,
      activeClass: "bg-[#112A46] text-white",
      inactiveClass: `${SETTINGS_TAB_NEUTRAL_INACTIVE} text-[#112A46]/75`,
      contentSurfaceClass: "bg-[#F7F9FC]",
      contentAccentClass: "border-t-2 border-[#112A46]/35",
    },
    {
      id: "app",
      label: lang === "ar" ? "التطبيق" : "App",
      hideCount: true,
      activeClass: "bg-[#E4B84A] text-[#112A46]",
      inactiveClass: `${SETTINGS_TAB_NEUTRAL_INACTIVE} text-[#957D43]/80`,
      contentSurfaceClass: "bg-[#FFFBF0]",
      contentAccentClass: "border-t-2 border-[#E4B84A]/45",
    },
    {
      id: "help",
      label: lang === "ar" ? "المساعدة" : "Help",
      hideCount: true,
      activeClass: "bg-[#806528] text-white",
      inactiveClass: `${SETTINGS_TAB_NEUTRAL_INACTIVE} text-[#806528]/75`,
      contentSurfaceClass: "bg-[#FAF7F0]",
      contentAccentClass: "border-t-2 border-[#806528]/40",
    },
  ];
}

export function buildSettingsOrgSubTabItems(lang, counts = {}) {
  return [
    {
      id: "stores",
      label: lang === "ar" ? "محلات" : "Stores",
      count: counts.stores ?? 0,
      activeClass: "bg-[#214B7B] text-white",
      inactiveClass: `${SETTINGS_TAB_NEUTRAL_INACTIVE} text-[#214B7B]/75`,
      badgeActiveClass: "bg-white/20 text-white",
      badgeInactiveClass: "bg-[#214B7B]/10 text-[#214B7B]",
      contentSurfaceClass: "bg-[#F5F8FC]",
      contentAccentClass: "border-t-2 border-[#214B7B]/40",
    },
    {
      id: "team",
      label: lang === "ar" ? "فريق" : "Team",
      count: counts.team ?? 0,
      activeClass: "bg-[#257844] text-white",
      inactiveClass: `${SETTINGS_TAB_NEUTRAL_INACTIVE} text-[#257844]/75`,
      badgeActiveClass: "bg-white/20 text-white",
      badgeInactiveClass: "bg-[#257844]/10 text-[#257844]",
      contentSurfaceClass: "bg-[#F4FAF6]",
      contentAccentClass: "border-t-2 border-[#257844]/40",
    },
    {
      id: "subscription",
      label: lang === "ar" ? "اشتراك" : "Plan",
      hideCount: true,
      activeClass: "bg-[#E4B84A] text-[#112A46]",
      inactiveClass: `${SETTINGS_TAB_NEUTRAL_INACTIVE} text-[#957D43]/80`,
      contentSurfaceClass: "bg-[#FFFBF0]",
      contentAccentClass: "border-t-2 border-[#E4B84A]/45",
    },
  ];
}

export function buildSettingsStoreSubTabItems(lang) {
  return [
    {
      id: "profile",
      label: lang === "ar" ? "بيانات" : "Details",
      hideCount: true,
      activeClass: "bg-[#257844] text-white",
      inactiveClass: `${SETTINGS_TAB_NEUTRAL_INACTIVE} text-[#257844]/75`,
      contentSurfaceClass: "bg-[#F4FAF6]",
      contentAccentClass: "border-t-2 border-[#257844]/40",
    },
    {
      id: "channels",
      label: lang === "ar" ? "دفع" : "Payment",
      hideCount: true,
      activeClass: "bg-[#214B7B] text-white",
      inactiveClass: `${SETTINGS_TAB_NEUTRAL_INACTIVE} text-[#214B7B]/75`,
      contentSurfaceClass: "bg-[#F5F8FC]",
      contentAccentClass: "border-t-2 border-[#214B7B]/40",
    },
    {
      id: "expenses",
      label: lang === "ar" ? "مصروفات" : "Expenses",
      hideCount: true,
      activeClass: "bg-[#B96725] text-white",
      inactiveClass: `${SETTINGS_TAB_NEUTRAL_INACTIVE} text-[#B96725]/80`,
      contentSurfaceClass: "bg-[#FFF8F2]",
      contentAccentClass: "border-t-2 border-[#B96725]/35",
    },
    {
      id: "operations",
      label: lang === "ar" ? "تشغيل" : "Ops",
      hideCount: true,
      activeClass: "bg-[#112A46] text-white",
      inactiveClass: `${SETTINGS_TAB_NEUTRAL_INACTIVE} text-[#112A46]/75`,
      contentSurfaceClass: "bg-[#F7F9FC]",
      contentAccentClass: "border-t-2 border-[#112A46]/35",
    },
  ];
}

export function resolveSettingsMainTabItem(lang, mainTab) {
  return buildSettingsMainTabItems(lang).find((item) => item.id === mainTab)
    || buildSettingsMainTabItems(lang)[0];
}

export function resolveSettingsOrgSubTabItem(lang, counts, subTab) {
  const items = buildSettingsOrgSubTabItems(lang, counts);
  return items.find((item) => item.id === subTab) || items[0];
}

export function resolveSettingsStoreSubTabItem(lang, panel) {
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

export function SettingsTabContentCard({ surfaceClass, accentClass, children, className = "" }) {
  return (
    <div
      className={`overflow-hidden rounded-b-[16px] border border-[#E8E1D4]/90 border-t-0 px-3 py-3 shadow-[0_2px_4px_rgba(17,42,70,0.04),0_8px_20px_rgba(17,42,70,0.06)] ${surfaceClass} ${accentClass} ${className}`}
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
}) {
  const stickyClass = sticky
    ? "sticky top-0 z-20 -mx-1 bg-[#F8F6F0]/95 px-1 pb-0 pt-0.5 backdrop-blur-sm supports-[backdrop-filter]:bg-[#F8F6F0]/88"
    : "";

  return (
    <article className={`mb-3 ${className}`}>
      <div className={stickyClass}>
        <div className="overflow-hidden rounded-t-[14px] border border-b-0 border-[#E8E1D4]/90 shadow-[0_-1px_0_rgba(17,42,70,0.06)]">
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
