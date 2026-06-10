"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BackTitle } from "./prototype-runtime-chrome";

export function Badge({ children, tone = "neutral" }) {
  const themes = { neutral: "bg-[#F0ECE2] text-[#655B45]", success: "bg-[#E6F5E9] text-[#257844]", warning: "bg-[#FFF0E2] text-[#B96725]", navy: "bg-[#E7EEF5] text-[#112A46]" };
  return <span className={`rounded-full px-2.5 py-1 text-taq-meta font-bold ${themes[tone]}`}>{children}</span>;
}

export function SettingToggle({ enabled, onToggle, disabled = false }) {
  return (
    <button
      disabled={disabled}
      onClick={onToggle}
      className={`relative h-6 w-11 rounded-full transition ${disabled ? "cursor-not-allowed opacity-55" : ""} ${enabled ? "bg-[#39A160]" : "bg-[#D9D3C7]"}`}
    >
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${enabled ? "left-1" : "left-6"}`} />
    </button>
  );
}

export function SettingRow({ title, desc, toggle, border }) {
  return (
    <div className={`flex items-center justify-between px-4 py-4 ${border ? "border-b border-[#F0ECE2]" : ""}`}>
      <div>
        <p className="text-sm font-black">{title}</p>
        <p className="mt-1 text-taq-meta text-[#827762]">{desc}</p>
      </div>
      {toggle}
    </div>
  );
}

export function ActionRow({ label, lang, danger = false, border = false, onClick = () => {} }) {
  const Arrow = lang === "ar" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between px-4 py-4 text-sm font-black ${border ? "border-b border-[#F0ECE2]" : ""} ${danger ? "text-[#B44747]" : "text-[#112A46]"}`}
    >
      <span>{label}</span>
      <Arrow className="h-4 w-4" />
    </button>
  );
}

export function SettingsLink({ lang, icon: Icon, title, desc = "", value = "", onClick, danger = false, border = true }) {
  const Arrow = lang === "ar" ? ChevronLeft : ChevronRight;
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-3 px-4 py-4 text-start ${border ? "border-b border-[#F0ECE2]" : ""}`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${danger ? "bg-[#FFF1EE] text-[#B44747]" : "bg-[#F7F5EF] text-[#806528]"}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-taq-body-sm font-black ${danger ? "text-[#B44747]" : "text-[#112A46]"}`}>{title}</span>
        {desc && <span className="mt-0.5 block truncate text-taq-meta font-bold text-[#827762]">{desc}</span>}
      </span>
      {value && <span className="shrink-0 text-taq-meta font-bold text-[#827762]">{value}</span>}
      <Arrow className={`h-4 w-4 shrink-0 ${danger ? "text-[#B44747]" : "text-[#B99844]"}`} />
    </button>
  );
}

export function SettingsPageHeader({ lang, title, onBack }) {
  return <BackTitle lang={lang} title={title} onBack={onBack} />;
}
