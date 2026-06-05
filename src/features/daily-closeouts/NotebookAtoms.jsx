"use client";
import React from "react";

import { notebookLinesBackground } from "./notebook-themes";

/**
 * A single horizontal notebook row with ruled-line styling.
 * `lines` controls the row height in units of 44px (the line interval).
 */
export function NotebookRow({ children, lines = 1, className = "", strong = false }) {
  return (
    <div
      className={`flex w-full items-end pb-[8px] ${strong ? "border-t-2 border-[#112A46]/60" : ""} ${className}`}
      style={{ height: `${lines * 44}px`, ...notebookLinesBackground("transparent") }}
    >
      {children}
    </div>
  );
}

/** Inline ink-styled wrapper for notebook text. */
export function NotebookInk({ children, className = "" }) {
  return <span className={className}>{children}</span>;
}

/** Displays a money value with a small currency suffix. */
export function MoneyValue({ value }) {
  const parts = typeof value === "string" ? value.match(/^(.*?)[ ]+(ر[.]س|SAR)$/) : null;
  if (!parts) return <>{value}</>;
  return (
    <span className="inline-flex items-baseline whitespace-nowrap">
      <span>{parts[1]}</span>
      <span className="ms-1 text-[0.58em] font-bold opacity-70">{parts[2]}</span>
    </span>
  );
}

/** Compact badge with tone-based coloring. */
export function Badge({ children, tone = "neutral" }) {
  const themes = {
    neutral: "bg-[#F0ECE2] text-[#655B45]",
    success: "bg-[#E6F5E9] text-[#257844]",
    warning: "bg-[#FFF0E2] text-[#B96725]",
    error: "bg-[#FFF1EE] text-[#B44747]",
    pending: "bg-[#E9F0FA] text-[#2F5EAD]",
    muted: "bg-[#F0ECE2] text-[#827762]",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-taq-meta font-bold ${themes[tone] ?? themes.neutral}`}>
      {children}
    </span>
  );
}

/** A labelled number row — label left, value right. */
export function NumberLine({ label, value, valueClassName = "" }) {
  return (
    <div className="flex w-full justify-between text-xs font-medium">
      <span>{label}</span>
      <strong className={`tabular-nums ${valueClassName}`}>
        <MoneyValue value={value} />
      </strong>
    </div>
  );
}

/** Tab button with animated gold underline. */
export function InkTab({ active, children, onClick, className = "", showActiveUnderline = true }) {
  return (
    <button type="button" onClick={onClick} className={`relative pb-2 text-taq-meta font-black transition ${active ? "text-[#112A46]" : "text-[#957D43]"} ${className}`}>
      <span className="relative inline-flex items-center whitespace-nowrap">
        {children}
        {active && showActiveUnderline && (
          <span className="absolute -bottom-[9px] left-0 right-0 h-[2px] rounded-full bg-[#C28A30] transition-all duration-200" />
        )}
      </span>
    </button>
  );
}

/** Two-column financial table: label left, value right, aligned to notebook lines. */
export function FinancialRows({ lang, rows = [] }) {
  return (
    <div className="grid w-full grid-cols-[minmax(0,1fr)_max-content] items-baseline">
      {rows.map((row) => (
        <React.Fragment key={row.id || row.label}>
          <div className="flex h-[44px] min-w-0 items-end pb-[8px] text-taq-body-sm font-medium text-[#112A46]">
            <span className="truncate">{row.label}</span>
          </div>
          <strong
            dir="ltr"
            className={`flex h-[44px] min-w-[76px] items-end whitespace-nowrap pb-[8px] tabular-nums text-taq-body font-bold ${lang === "ar" ? "justify-start ps-4" : "justify-end pe-4"} ${row.valueClassName || "text-[#112A46]"}`}
          >
            <MoneyValue value={row.value} />
          </strong>
        </React.Fragment>
      ))}
    </div>
  );
}

/** Back arrow + title used at the top of settings sub-panels. */
import { ChevronLeft, ChevronRight } from "lucide-react";
export function BackTitle({ title, onBack, lang, inNotebook = false }) {
  const BackIcon = lang === "ar" ? ChevronRight : ChevronLeft;
  return (
    <div className={`mb-5 flex items-center gap-3 ${inNotebook ? "" : "px-5"}`}>
      <button type="button" onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0ECE2]">
        <BackIcon className="h-5 w-5" />
      </button>
      <h2 className="text-base font-black">{title}</h2>
    </div>
  );
}
