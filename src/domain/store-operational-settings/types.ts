export const DEFAULT_EXPENSE_CATEGORY_IDS = [
  "rent",
  "salary",
  "utility",
  "phone",
  "maintenance",
  "other",
] as const;

export type EmployeeHistoryVisibility = "week" | "month" | "all";

export type StoreOperationalSettings = {
  activeCategories: string[];
  employeeHistoryVisibility: EmployeeHistoryVisibility;
  closeoutAlert: boolean;
  notebookTheme: string | null;
};
