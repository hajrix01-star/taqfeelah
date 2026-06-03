"use client";

import { notebookLinesBackground, notebookThemes } from "./notebook-themes";

/** Scrollable notebook page: lines and red margin move with content (full scroll height). Same as owner home/reports. */
export default function NotebookScrollSurface({ theme = "yellow", lang = "ar", children, className = "" }) {
  const activeTheme = notebookThemes[theme] || notebookThemes.yellow;
  const isArabic = lang === "ar";
  return (
    <div className={`taq-notebook-surface relative min-h-full ${className}`} style={notebookLinesBackground(theme)}>
      <div
        className={`taq-notebook-margin pointer-events-none absolute inset-y-0 z-0 w-[1.25px] ${isArabic ? "right-8" : "left-8"}`}
        style={{ backgroundColor: activeTheme.margin }}
      />
      <div className="taq-notebook-content relative z-[1] min-h-full">{children}</div>
    </div>
  );
}
