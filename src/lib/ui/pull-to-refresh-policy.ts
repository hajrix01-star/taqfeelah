import type {
  PullToRefreshTarget,
  ResolvePullToRefreshNotebookSurfaceInput,
  ResolvePullToRefreshTargetInput,
} from "@/lib/ui/pull-to-refresh-types";

/** Owner main pages that support pull-to-refresh. */
export const OWNER_PULL_TO_REFRESH_PAGES = new Set(["home", "notebook", "register", "closeouts"]);

/** Employee main pages that support pull-to-refresh. */
export const EMPLOYEE_PULL_TO_REFRESH_PAGES = new Set(["closeouts"]);

export function resolvePullToRefreshTarget({
  employee,
  ownerPage,
  employeePage,
  employeeEntryActive,
  ownerEntryActive,
  ownerEditActive,
  hasActiveEmployee,
}: ResolvePullToRefreshTargetInput): PullToRefreshTarget | null {
  if (employee) {
    if (!hasActiveEmployee || employeeEntryActive) return null;
    if (!EMPLOYEE_PULL_TO_REFRESH_PAGES.has(employeePage)) return null;
    return "closeouts";
  }

  if (ownerEntryActive || ownerEditActive) return null;
  if (!OWNER_PULL_TO_REFRESH_PAGES.has(ownerPage)) return null;
  if (ownerPage === "closeouts") return "closeouts";
  return "operational-entries";
}

export function resolvePullToRefreshUsesNotebookSurface({
  employee,
  ownerPage,
  employeePage,
}: ResolvePullToRefreshNotebookSurfaceInput): boolean {
  if (employee) {
    return employeePage === "closeouts";
  }
  return ownerPage === "home" || ownerPage === "notebook" || ownerPage === "register" || ownerPage === "closeouts";
}
