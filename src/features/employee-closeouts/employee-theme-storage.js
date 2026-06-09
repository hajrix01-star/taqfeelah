import { usesRuntimeSettingsApi } from "@/core/config/runtime-capabilities";
import { isBrowserPersistentStorageAllowed } from "@/core/config/browser-persistence-policy";

const prefix = "taqfeelah_employee_notebook_theme_";

function usesServerEmployeePreferences() {
  return usesRuntimeSettingsApi();
}

export function readEmployeeNotebookTheme(employeeId) {
  if (usesServerEmployeePreferences()) return null;
  if (!isBrowserPersistentStorageAllowed({ scope: "ui-preferences" })) return null;
  if (typeof window === "undefined" || !employeeId) return null;
  return window.localStorage.getItem(`${prefix}${employeeId}`);
}

export function writeEmployeeNotebookTheme(employeeId, theme) {
  if (usesServerEmployeePreferences()) return;
  if (!isBrowserPersistentStorageAllowed({ scope: "ui-preferences" })) return;
  if (typeof window === "undefined" || !employeeId) return;
  if (!theme) window.localStorage.removeItem(`${prefix}${employeeId}`);
  else window.localStorage.setItem(`${prefix}${employeeId}`, theme);
}
