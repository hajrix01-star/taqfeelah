"use client";

import React from "react";

type BadgeTone = "neutral" | "success" | "warning" | "navy";

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: BadgeTone }) {
  const themes: Record<BadgeTone, string> = { neutral: "bg-[#F0ECE2] text-[#655B45]", success: "bg-[#E6F5E9] text-[#257844]", warning: "bg-[#FFF0E2] text-[#B96725]", navy: "bg-[#E7EEF5] text-[#112A46]" };
  return <span className={`rounded-full px-2.5 py-1 text-taq-meta font-bold ${themes[tone]}`}>{children}</span>;
}
function InkTab({
  active,
  children,
  onClick,
  className = "",
  titleUnderline = false,
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
    <button onClick={onClick} className={`relative pb-2 text-taq-meta font-black transition ${active ? "text-[#112A46]" : "text-[#957D43]"} ${className}`}>
      <span className="relative inline-flex items-center whitespace-nowrap">
        {children}
        {active && showActiveUnderline && (
          <span className="absolute -bottom-[9px] left-0 right-0 h-[2px] rounded-full bg-[#C28A30] transition-all duration-200" />
        )}
      </span>
    </button>
  );
}

export { Badge, InkTab };
