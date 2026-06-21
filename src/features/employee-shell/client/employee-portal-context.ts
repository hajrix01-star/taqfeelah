import { isUuid } from "@/core/client/api-id-utils";
import { usesRuntimeSettingsApi } from "@/core/config/runtime-capabilities";
import { resolveNotebookTheme } from "@/features/daily-closeouts/notebook-themes";
import { readEmployeeNotebookTheme } from "@/features/employee-closeouts/employee-theme-storage";
import {
  resolveActiveEmployee,
  resolveAssignedEmployeeBusinesses,
  resolveCurrentEmployeeBusiness,
  synthesizeEmployeeBusinessesFromStoreIds,
} from "@/features/employee-closeouts/employee-portal-session";
import { getStoreOperationalConfig } from "@/features/org-config/client/store-operational-config";
import { resolveStoreChannelConfig } from "@/features/org-config/client/store-channel-config";
import { resolveSuggestedEntryDate } from "@/features/operations/operational-entry-save-helpers";
import type { EmployeePortalContextInput } from "@/features/employee-shell/client/employee-shell-client-types";

export function buildEmployeePortalContext({
  employee = false,
  loggedInEmployeeId = "",
  staff = [],
  sessionUserId = "",
  activeBusinesses = [],
  employeeBusinessId = "",
  storeChannelSettings = {},
  defaultStoreChannelConfig = { channels: [], activeIds: [] },
  storeOperationalSettings = {},
  notebookTheme = "yellow",
  employeeThemeOverride = null,
  expenseCategories = [],
  lastCloseoutDates = {},
  todayDate = "",
  nextDay = (date: string) => date,
  uuidChecker = isUuid,
}: EmployeePortalContextInput) {
  const activeEmployee = resolveActiveEmployee({
    employee,
    loggedInEmployeeId,
    staff,
    sessionUserId,
    uuidChecker,
  });
  const matchedEmployeeBusinesses = resolveAssignedEmployeeBusinesses(activeBusinesses, activeEmployee);
  const assignedEmployeeBusinesses = matchedEmployeeBusinesses.length
    ? matchedEmployeeBusinesses
    : synthesizeEmployeeBusinessesFromStoreIds(activeEmployee?.storeIds);
  const currentEmployeeBusiness = resolveCurrentEmployeeBusiness(
    assignedEmployeeBusinesses,
    employeeBusinessId,
  );
  const currentEmployeeChannelConfig = resolveStoreChannelConfig(
    storeChannelSettings,
    currentEmployeeBusiness?.id,
    defaultStoreChannelConfig,
  );
  const currentEmployeeOperationalConfig = getStoreOperationalConfig(
    storeOperationalSettings,
    currentEmployeeBusiness?.id ?? "",
  );
  const currentEmployeeCategories = expenseCategories.filter(
    (item) => currentEmployeeOperationalConfig.activeCategories.includes(item.id),
  );
  const employeeNotebookTheme = resolveNotebookTheme({
    storeOperationalSettings: storeOperationalSettings as Record<string, { notebookTheme?: string }>,
    storeId: currentEmployeeBusiness?.id,
    globalTheme: notebookTheme,
    employeeThemeOverride: employeeThemeOverride
      || (!usesRuntimeSettingsApi() && activeEmployee ? readEmployeeNotebookTheme(activeEmployee.id ?? "") : null),
  });
  const suggestedEntryDate = resolveSuggestedEntryDate({
    lastCloseoutDate: currentEmployeeBusiness
      ? lastCloseoutDates[currentEmployeeBusiness.id ?? ""]
      : undefined,
    todayDate,
    nextDay,
  });
  const assignedEmployeeBusinessIds = assignedEmployeeBusinesses.map((business) => business.id ?? "");

  return {
    activeEmployee,
    assignedEmployeeBusinesses,
    currentEmployeeBusiness,
    currentEmployeeChannelConfig,
    currentEmployeeOperationalConfig,
    currentEmployeeCategories,
    employeeNotebookTheme,
    suggestedEntryDate,
    assignedEmployeeBusinessIds,
  };
}
