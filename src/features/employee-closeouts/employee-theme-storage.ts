import type { NotebookThemeId } from "@/features/daily-closeouts/daily-closeouts-types";

import { usesRuntimeSettingsApi } from "@/core/config/runtime-capabilities";
import { isBrowserPersistentStorageAllowed } from "@/core/config/browser-persistence-policy";

const prefix = "taqfeelah_employee_notebook_theme_";

function usesServerEmployeePreferences(): boolean {
  return usesRuntimeSettingsApi();
}

export function readEmployeeNotebookTheme(employeeId: string | null | undefined): string | null {
  if (usesServerEmployeePreferences()) return null;
  if (!isBrowserPersistentStorageAllowed({ scope: "ui-preferences" })) return null;
  if (typeof window === "undefined" || !employeeId) return null;
  return window.localStorage.getItem(`${prefix}${employeeId}`);
}

export function writeEmployeeNotebookTheme(
  employeeId: string | null | undefined,
  theme: NotebookThemeId | string | null | undefined,
): void {
  if (usesServerEmployeePreferences()) return;
  if (!isBrowserPersistentStorageAllowed({ scope: "ui-preferences" })) return;
  if (typeof window === "undefined" || !employeeId) return;
  if (!theme) window.localStorage.removeItem(`${prefix}${employeeId}`);
  else window.localStorage.setItem(`${prefix}${employeeId}`, theme);
}
