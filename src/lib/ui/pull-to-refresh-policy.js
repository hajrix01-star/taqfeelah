/** Owner main pages that support pull-to-refresh. */
export const OWNER_PULL_TO_REFRESH_PAGES = new Set(["home", "notebook", "register", "closeouts"]);

/** Employee main pages that support pull-to-refresh. */
export const EMPLOYEE_PULL_TO_REFRESH_PAGES = new Set(["closeouts"]);

/**
 * @typedef {"closeouts" | "operational-entries"} PullToRefreshTarget
 */

/**
 * Resolves whether pull-to-refresh is active and which data source to refresh.
 *
 * @param {{
 *   employee: boolean;
 *   ownerPage: string;
 *   employeePage: string;
 *   employeeEntryActive: boolean;
 *   ownerEntryActive: boolean;
 *   hasActiveEmployee: boolean;
 * }} input
 * @returns {PullToRefreshTarget | null}
 */
export function resolvePullToRefreshTarget({
  employee,
  ownerPage,
  employeePage,
  employeeEntryActive,
  ownerEntryActive,
  hasActiveEmployee,
}) {
  if (employee) {
    if (!hasActiveEmployee || employeeEntryActive) return null;
    if (!EMPLOYEE_PULL_TO_REFRESH_PAGES.has(employeePage)) return null;
    return "closeouts";
  }

  if (ownerEntryActive) return null;
  if (!OWNER_PULL_TO_REFRESH_PAGES.has(ownerPage)) return null;
  if (ownerPage === "closeouts") return "closeouts";
  return "operational-entries";
}

/**
 * Notebook pages should reveal matching paper/lines while pulling — not shell gray.
 *
 * @param {{
 *   employee: boolean;
 *   ownerPage: string;
 *   employeePage: string;
 * }} input
 */
export function resolvePullToRefreshUsesNotebookSurface({
  employee,
  ownerPage,
  employeePage,
}) {
  if (employee) {
    return employeePage === "closeouts";
  }
  return ownerPage === "home" || ownerPage === "notebook" || ownerPage === "register" || ownerPage === "closeouts";
}
