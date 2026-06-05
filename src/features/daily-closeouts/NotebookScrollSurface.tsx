"use client";

import type { ReactNode } from "react";
import { notebookLinesBackground, notebookThemes, type NotebookThemeKey } from "./notebook-themes";

type Props = {
  theme?: string;
  lang?: "ar" | "en";
  children: ReactNode;
  className?: string;
};

/** Scrollable notebook page: lines and red margin move with content (full scroll height). */
export default function NotebookScrollSurface({ theme = "yellow", lang = "ar", children, className = "" }: Props) {
  const themeKey = (theme in notebookThemes ? theme : "yellow") as NotebookThemeKey;
  const activeTheme = notebookThemes[themeKey];
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
