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
  reviewEnabled: boolean;
  closeoutReviewEnabled: boolean;
  employeeHistoryVisibility: EmployeeHistoryVisibility;
  closeoutAlert: boolean;
  attachmentAlert: boolean;
  notebookTheme: string | null;
};
