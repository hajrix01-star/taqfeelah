"use client";

import { notebookLinesBackground } from "./notebook-themes";

/** Scrollable notebook page: ruled lines move with content (full scroll height). Same as owner home/reports. */
export default function NotebookScrollSurface({ theme = "yellow", lang = "ar", children, className = "" }) {
  return (
    <div className={`taq-notebook-surface relative min-h-full ${className}`} style={notebookLinesBackground(theme)}>
      <div className="taq-notebook-content relative z-[1] min-h-full">{children}</div>
    </div>
  );
}
