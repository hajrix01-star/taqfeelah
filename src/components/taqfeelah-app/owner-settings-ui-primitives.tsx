"use client";

import React from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { BackTitle } from "./taqfeelah-app-chrome";
import { taqInteractive } from "@/core/ui/interactive-classes";
import type { DisplayLang, IconComponent } from "./taqfeelah-app-types";

type BadgeTone = "neutral" | "success" | "warning" | "navy";

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: BadgeTone }) {
  const themes: Record<BadgeTone, string> = { neutral: "bg-[var(--taq-color-f0ece2)] text-[var(--taq-color-655b45)]", success: "bg-[var(--taq-color-e6f5e9)] text-[var(--taq-color-257844)]", warning: "bg-[var(--taq-color-fff0e2)] text-[var(--taq-color-b96725)]", navy: "bg-[var(--taq-color-e7eef5)] text-[var(--taq-color-112a46)]" };
  return <span className={`rounded-full px-2.5 py-1 text-taq-meta font-bold ${themes[tone]}`}>{children}</span>;
}

export function SettingToggle({ enabled, onToggle, disabled = false }: { enabled: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={onToggle}
      className={`relative h-6 w-11 rounded-full transition ${taqInteractive.none} ${disabled ? "cursor-not-allowed opacity-55" : ""} ${enabled ? "bg-[var(--taq-color-39a160)]" : "bg-[var(--taq-color-d9d3c7)]"}`}
    >
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${enabled ? "left-1" : "left-6"}`} />
    </button>
  );
}

export function SettingRow({ title, desc, toggle, border }: { title: React.ReactNode; desc?: React.ReactNode; toggle: React.ReactNode; border?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-4 py-4 ${border ? "border-b border-[var(--taq-color-f0ece2)]" : ""}`}>
      <div>
        <p className="text-sm font-black">{title}</p>
        <p className="mt-1 text-taq-meta text-[var(--taq-color-827762)]">{desc}</p>
      </div>
      {toggle}
    </div>
  );
}

export function ActionRow({ label, lang, danger = false, border = false, onClick = () => {} }: { label: React.ReactNode; lang: DisplayLang; danger?: boolean; border?: boolean; onClick?: () => void }) {
  const Arrow = lang === "ar" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${danger ? taqInteractive.rowDanger : taqInteractive.row} flex w-full items-center justify-between px-4 py-4 text-sm font-black ${border ? "border-b border-[var(--taq-color-f0ece2)]" : ""} ${danger ? "text-[var(--taq-color-b44747)]" : "text-[var(--taq-color-112a46)]"}`}
    >
      <span>{label}</span>
      <Arrow className="h-4 w-4" />
    </button>
  );
}

export function SettingsLink({ lang, icon: Icon, title, desc = "", value = "", onClick, danger = false, border = true }: { lang: DisplayLang; icon: IconComponent; title: React.ReactNode; desc?: string; value?: string; onClick: () => void; danger?: boolean; border?: boolean }) {
  const Arrow = lang === "ar" ? ChevronLeft : ChevronRight;
  return (
    <button type="button" onClick={onClick} className={`${danger ? taqInteractive.rowDanger : taqInteractive.row} flex w-full items-center gap-3 px-4 py-4 text-start ${border ? "border-b border-[var(--taq-color-f0ece2)]" : ""}`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${danger ? "bg-[var(--taq-color-fff1ee)] text-[var(--taq-color-b44747)]" : "bg-[var(--taq-color-f7f5ef)] text-[var(--taq-color-806528)]"}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-taq-body-sm font-black ${danger ? "text-[var(--taq-color-b44747)]" : "text-[var(--taq-color-112a46)]"}`}>{title}</span>
        {desc && <span className="mt-0.5 block truncate text-taq-meta font-bold text-[var(--taq-color-827762)]">{desc}</span>}
      </span>
      {value && <span className="shrink-0 text-taq-meta font-bold text-[var(--taq-color-827762)]">{value}</span>}
      <Arrow className={`h-4 w-4 shrink-0 ${danger ? "text-[var(--taq-color-b44747)]" : "text-[var(--taq-color-b99844)]"}`} />
    </button>
  );
}

export function SettingsPageHeader({ lang, title, onBack, subtitle = "", badge = null }: { lang: DisplayLang; title: React.ReactNode; onBack: () => void; subtitle?: string; badge?: React.ReactNode }) {
  if (subtitle || badge) {
    const BackIcon = lang === "ar" ? ChevronRight : ChevronLeft;
    return (
      <div className="mb-4 flex items-start gap-3">
        <button
          type="button"
          onClick={onBack}
          className={`${taqInteractive.icon} flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.04]`}
        >
          <BackIcon className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="truncate text-xl font-black">{title}</h2>
            {badge}
          </div>
          {subtitle ? (
            <p className="mt-1 truncate text-taq-meta font-bold text-[var(--taq-color-827762)]">{subtitle}</p>
          ) : null}
        </div>
      </div>
    );
  }
  return <BackTitle lang={lang} title={String(title)} onBack={onBack} />;
}

export function SettingsAccordionSection({
  lang: _lang,
  icon: Icon,
  title,
  subtitle = "",
  value = "",
  expanded,
  onToggle,
  children,
}: {
  lang: DisplayLang;
  icon: IconComponent;
  title: React.ReactNode;
  subtitle?: string;
  value?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const Chevron = expanded ? ChevronUp : ChevronDown;
  return (
    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/[0.045]">
      <button type="button" onClick={onToggle} className={`${taqInteractive.row} flex w-full items-center gap-3 px-4 py-4 text-start`}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--taq-color-f7f5ef)] text-[var(--taq-color-806528)]">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-taq-body-sm font-black text-[var(--taq-color-112a46)]">{title}</span>
          {(subtitle || value) && (
            <span className="mt-0.5 block truncate text-taq-meta font-bold text-[var(--taq-color-827762)]">
              {value || subtitle}
            </span>
          )}
        </span>
        <Chevron className="h-4 w-4 shrink-0 text-[var(--taq-color-b99844)]" />
      </button>
      {expanded && <div className="border-t border-[var(--taq-color-f0ece2)] px-4 pb-4 pt-3">{children}</div>}
    </div>
  );
}
