"use client";

import type { ReactNode } from "react";
import { notebookLinesBackground } from "./notebook-themes";
import type { CloseoutSyncLang, NotebookPatternId, NotebookThemeId } from "./daily-closeouts-types";

/** Scrollable notebook page: ruled lines move with content (full scroll height). Same as owner home/reports. */
export default function NotebookScrollSurface({
  theme = "yellow",
  pattern = "lined",
  lang: _lang = "ar",
  children,
  className = "",
}: {
  theme?: NotebookThemeId | string;
  pattern?: NotebookPatternId | string;
  lang?: CloseoutSyncLang;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`taq-notebook-surface relative min-h-full ${className}`} style={notebookLinesBackground(theme, pattern)}>
      <div className="taq-notebook-content relative z-[1] min-h-full">{children}</div>
    </div>
  );
}
