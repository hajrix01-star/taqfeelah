import { isBrowserPersistentStorageAllowed } from "@/core/config/browser-persistence-policy";

const prefix = "taqfeelah_employee_notebook_theme_";

export function readEmployeeNotebookTheme(employeeId) {
  if (!isBrowserPersistentStorageAllowed({ scope: "ui-preferences" })) return null;
  if (typeof window === "undefined" || !employeeId) return null;
  return window.localStorage.getItem(`${prefix}${employeeId}`);
}

export function writeEmployeeNotebookTheme(employeeId, theme) {
  if (!isBrowserPersistentStorageAllowed({ scope: "ui-preferences" })) return;
  if (typeof window === "undefined" || !employeeId) return;
  if (!theme) window.localStorage.removeItem(`${prefix}${employeeId}`);
  else window.localStorage.setItem(`${prefix}${employeeId}`, theme);
}
