"use client";

import { Plus } from "lucide-react";

/** Same bottom bar shell and + button as owner BottomNav. */
export default function EmployeeFooterNav({ lang, onAdd }) {
  return (
    <nav className="taq-owner-nav relative z-30 flex h-[64px] w-full shrink-0 items-center justify-between border-t border-[#ECE6DA] bg-white/95 px-4 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="w-[52px]" aria-hidden />
      <button
        type="button"
        onClick={onAdd}
        aria-label={lang === "ar" ? "فتح تقفيلة يوم جديد" : "Open new daily closeout"}
        className="absolute left-1/2 top-0.5 flex h-[56px] w-[56px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[4px] border-[#F8F6F0] bg-[#E4B84A] text-[#112A46] shadow-sm"
      >
        <Plus className="h-7 w-7" strokeWidth={2.4} />
      </button>
      <div className="w-[52px]" aria-hidden />
    </nav>
  );
}
