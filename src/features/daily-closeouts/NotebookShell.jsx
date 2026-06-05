"use client";

import AttachmentPreview from "@/components/AttachmentPreview";
import { text } from "@/i18n/text";
import { money, signedEntryAmount } from "@/utils/display-helpers";
import { entryIsVoided } from "@/features/operations/operational-analytics";
import { notebookThemes } from "@/features/daily-closeouts/notebook-themes";
import { MoneyValue, NotebookRow } from "@/features/daily-closeouts/NotebookAtoms";

export function Notebook({ children, theme = "yellow", lang = "ar", marginContent = null, fullPage = false }) {
  const isArabic = lang === "ar";
  const activeTheme = notebookThemes[theme] || notebookThemes.yellow;
  const lines = {
    backgroundImage: `repeating-linear-gradient(180deg, transparent 0px, transparent 43px, ${activeTheme.line} 43px, ${activeTheme.line} 44px)`,
  };

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`relative overflow-hidden px-5 pb-0 pt-0 ${fullPage ? "" : `rounded-[28px] ${activeTheme.ring ? "ring-1 ring-[#DED8CB]" : ""}`}`}
      style={{
        backgroundColor: fullPage ? "transparent" : activeTheme.paper,
        boxShadow: fullPage ? "none" : activeTheme.shadow,
        fontFamily: lang === "ar" ? "'Noto Sans Arabic', sans-serif" : "'Noto Sans', sans-serif",
      }}
    >
      {!fullPage && <div className="pointer-events-none absolute inset-0 opacity-70" style={lines} />}
      {!fullPage && (
        <div
          className={`pointer-events-none absolute bottom-0 top-0 w-[1.25px] ${isArabic ? "right-8" : "left-8"}`}
          style={{ backgroundColor: activeTheme.margin }}
        />
      )}
      {marginContent && (
        <div className={`absolute top-[18px] z-20 flex w-[29px] flex-col items-center ${isArabic ? "right-[1px]" : "left-[1px]"}`}>
          {marginContent}
        </div>
      )}
      <div className={`relative ${isArabic ? "pr-6 pl-1" : "pl-6 pr-1"}`}>{children}</div>
    </div>
  );
}

export function DayAttachments({ lang, group, reviewEnabled = false, onOpenOperation = () => {} }) {
  if (!group?.items?.length) {
    return (
      <NotebookRow>
        <p className="text-xs font-bold text-[#806528]">{text(lang, "noAttachmentsDay")}</p>
      </NotebookRow>
    );
  }

  return (
    <div className="py-3">
      <div className="flex gap-3 overflow-x-auto pb-1">
        {group.items.map((item) => (
          <button key={item.id} onClick={() => onOpenOperation(item.entry)} className="min-w-[78px] text-center">
            <div className="mb-1 flex h-14 justify-center overflow-hidden rounded-xl">
              <AttachmentPreview attachment={item.attachment} className="h-14 w-14 rounded-xl" />
            </div>
            <p className="truncate text-[10px] font-bold">{lang === "ar" ? item.title : item.titleEn}</p>
            <p className={`mt-0.5 text-[10px] font-black ${item.entry.type === "summary" ? "text-[#257844]" : "text-[#B44747]"}`}>
              <MoneyValue value={money(signedEntryAmount(item.entry), lang)} />
            </p>
            {reviewEnabled && !entryIsVoided(item.entry) && !item.reviewed && (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#B96725]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
