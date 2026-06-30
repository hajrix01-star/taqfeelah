import type { NotebookThemeId } from "@/features/daily-closeouts/daily-closeouts-types";

import { usesRuntimeSettingsApi } from "@/core/config/runtime-capabilities";
import {
  safeGetLocalStorageItem,
  safeRemoveLocalStorageItem,
  safeSetLocalStorageItem,
} from "@/core/client/safe-local-storage";

const prefix = "taqfeelah_employee_notebook_theme_";

function usesServerEmployeePreferences(): boolean {
  return usesRuntimeSettingsApi();
}

export function readEmployeeNotebookTheme(employeeId: string | null | undefined): string | null {
  if (usesServerEmployeePreferences()) return null;
  if (!employeeId) return null;
  return safeGetLocalStorageItem(`${prefix}${employeeId}`, { scope: "ui-preferences" });
}

export function writeEmployeeNotebookTheme(
  employeeId: string | null | undefined,
  theme: NotebookThemeId | string | null | undefined,
): void {
  if (usesServerEmployeePreferences()) return;
  if (!employeeId) return;
  if (!theme) safeRemoveLocalStorageItem(`${prefix}${employeeId}`, { scope: "ui-preferences" });
  else safeSetLocalStorageItem(`${prefix}${employeeId}`, theme, { scope: "ui-preferences" });
}
