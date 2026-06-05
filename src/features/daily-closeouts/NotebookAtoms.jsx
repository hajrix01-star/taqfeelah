"use client";

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
