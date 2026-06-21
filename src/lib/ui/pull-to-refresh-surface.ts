import { notebookLinesBackground } from "@/features/daily-closeouts/notebook-themes";
import type { CSSProperties } from "react";

const SHELL_SCROLL_SURFACE: CSSProperties = { backgroundColor: "#F8F6F0" };

export function resolvePullToRefreshSurfaceStyle(
  usesNotebookSurface: boolean,
  notebookTheme: string,
): CSSProperties {
  if (usesNotebookSurface) {
    return notebookLinesBackground(notebookTheme);
  }
  return SHELL_SCROLL_SURFACE;
}
