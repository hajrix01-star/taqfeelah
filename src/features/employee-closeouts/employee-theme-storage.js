const prefix = "taqfeelah_employee_notebook_theme_";

export function readEmployeeNotebookTheme(employeeId) {
  if (typeof window === "undefined" || !employeeId) return null;
  return window.localStorage.getItem(`${prefix}${employeeId}`);
}

export function writeEmployeeNotebookTheme(employeeId, theme) {
  if (typeof window === "undefined" || !employeeId) return;
  if (!theme) window.localStorage.removeItem(`${prefix}${employeeId}`);
  else window.localStorage.setItem(`${prefix}${employeeId}`, theme);
}
