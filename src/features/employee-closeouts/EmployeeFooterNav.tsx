"use client";

import { Plus } from "lucide-react";

type Props = {
  lang: "ar" | "en";
  onAdd: () => void;
};

/** Bottom action bar with centered + button for employee entry flow. */
export default function EmployeeFooterNav({ lang, onAdd }: Props) {
  return (
    <nav className="taq-owner-nav relative z-30 flex h-[64px] w-full shrink-0 items-center justify-between border-t border-[#ECE6DA] bg-white/95 px-4 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="w-[52px]" aria-hidden />
      <button
        type="button"
        onClick={onAdd}
        aria-label={lang === "ar" ? "إضافة" : "Add"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#C28A30] text-white shadow-lg active:scale-95"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>
      <div className="w-[52px]" aria-hidden />
    </nav>
  );
}
