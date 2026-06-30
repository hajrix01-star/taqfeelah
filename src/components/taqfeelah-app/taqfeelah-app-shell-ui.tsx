"use client";

import React from "react";

type BadgeTone = "neutral" | "success" | "warning" | "navy";

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: BadgeTone }) {
  const themes: Record<BadgeTone, string> = { neutral: "bg-[var(--taq-color-f0ece2)] text-[var(--taq-color-655b45)]", success: "bg-[var(--taq-color-e6f5e9)] text-[var(--taq-color-257844)]", warning: "bg-[var(--taq-color-fff0e2)] text-[var(--taq-color-b96725)]", navy: "bg-[var(--taq-color-e7eef5)] text-[var(--taq-color-112a46)]" };
  return <span className={`rounded-full px-2.5 py-1 text-taq-meta font-bold ${themes[tone]}`}>{children}</span>;
}
function InkTab({
  active,
  children,
  onClick,
  className = "",
  titleUnderline: _titleUnderline = false,
  showActiveUnderline = true,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  titleUnderline?: boolean;
  showActiveUnderline?: boolean;
}) {
  return (
    <button onClick={onClick} className={`relative pb-2 text-taq-meta font-black transition ${active ? "text-[var(--taq-color-112a46)]" : "text-[var(--taq-color-957d43)]"} ${className}`}>
      <span className="relative inline-flex items-center whitespace-nowrap">
        {children}
        {active && showActiveUnderline && (
          <span className="absolute -bottom-[9px] left-0 right-0 h-[2px] rounded-full bg-[var(--taq-color-c28a30)] transition-all duration-200" />
        )}
      </span>
    </button>
  );
}

export { Badge, InkTab };
