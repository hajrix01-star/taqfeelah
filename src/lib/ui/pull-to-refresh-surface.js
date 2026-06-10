import { notebookLinesBackground } from "@/features/daily-closeouts/notebook-themes";

const SHELL_SCROLL_SURFACE = { backgroundColor: "#F8F6F0" };

/**
 * @param {boolean} usesNotebookSurface
 * @param {string} notebookTheme
 */
export function resolvePullToRefreshSurfaceStyle(usesNotebookSurface, notebookTheme) {
  if (usesNotebookSurface) {
    return notebookLinesBackground(notebookTheme);
  }
  return SHELL_SCROLL_SURFACE;
}
