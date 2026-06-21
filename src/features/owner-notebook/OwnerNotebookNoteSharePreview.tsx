"use client";

import { TAQFEELAH_LOGO_SRC } from "@/lib/brand/taqfeelah-logo";
import { resolveAppFontFamily } from "@/core/fonts/app-font-family";
import { notebookLinesBackground, notebookThemes } from "@/features/daily-closeouts/notebook-themes";
import type { NotebookThemeId } from "@/features/daily-closeouts/daily-closeouts-types";
import type { OwnerNotebookNoteSharePreviewProps } from "@/features/owner-notebook/client/owner-notebook-client-types";

function kindPillClass(kind: string, done: boolean) {
  if (done) return "bg-[#E6F5E9] text-[#257844]";
  if (kind === "task") return "bg-[#E7EEF5] text-[#214B7B]";
  return "bg-[#FFF4D2] text-[#806528]";
}

/**
 * Compact lined notebook share card for a single owner note — tuned for html-to-image capture.
 */
export default function OwnerNotebookNoteSharePreview({
  lang = "ar",
  theme = "yellow",
  fluid = false,
  periodLabel,
  title,
  kindLabel,
  kind = "note",
  done = false,
  noteText = "",
  checklist = [],
}: OwnerNotebookNoteSharePreviewProps) {
  const themeKey = theme as NotebookThemeId;
  const activeTheme = notebookThemes[themeKey] || notebookThemes.yellow;
  const lines = notebookLinesBackground(themeKey);
  const fontFamily = resolveAppFontFamily(lang);
  const isArabic = lang === "ar";

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className={`${fluid ? "w-full" : "w-[390px]"} overflow-hidden rounded-[20px] shadow-[0_10px_32px_rgba(17,42,70,0.12)] ring-1 ring-[#112A46]/[0.06]`}
      style={{ backgroundColor: activeTheme.paper, fontFamily }}
    >
      <div className="relative px-4 pb-3 pt-3" style={lines}>
        <div className="flex items-center justify-center pb-4 pt-1">
          {/* Kept as a plain image because this DOM subtree is captured directly into a shareable bitmap. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={TAQFEELAH_LOGO_SRC}
            alt=""
            draggable={false}
            className="h-9 w-[108px] select-none object-contain"
          />
        </div>

        <p className="mb-2.5 text-center text-[11px] font-bold text-[#827762]">{periodLabel}</p>

        <div className="mb-2 flex flex-col items-center gap-1.5">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <p className="text-[15px] font-black leading-none text-[#112A46]">{title}</p>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${kindPillClass(kind, done)}`}>
              {kindLabel}
            </span>
          </div>
          <span className="block h-[2px] w-14 rounded-full bg-[#C28A30]" />
        </div>

        <div className="min-h-[88px] pb-1">
          {noteText ? (
            <p
              className={`whitespace-pre-wrap text-[14px] font-bold leading-[44px] ${
                done && !checklist.length ? "text-[#A99D87] line-through decoration-[#A99D87]/70" : "text-[#112A46]"
              }`}
            >
              {noteText}
            </p>
          ) : null}
          {checklist.length > 0 ? (
            <ul className={`space-y-1 ${noteText ? "mt-1" : ""}`}>
              {checklist.map((item) => (
                <li
                  key={item.id}
                  className={`text-[14px] font-bold leading-[32px] ${
                    item.done ? "text-[#A99D87] line-through" : "text-[#112A46]"
                  }`}
                >
                  {item.done ? "☑" : "☐"} {item.text}
                </li>
              ))}
            </ul>
          ) : null}
          {!noteText && !checklist.length ? (
            <p className="text-[14px] font-bold leading-[44px] text-[#112A46]">{"\u00A0"}</p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-[#112A46]/[0.07] bg-white/30 px-4 py-2 text-center backdrop-blur-[1px]">
        <p className="text-[10px] font-bold text-[#957D43]">
          {isArabic ? "دفتري" : "My notebook"}
        </p>
      </div>
    </div>
  );
}
