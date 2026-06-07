"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveEmployeeBusinessId } from "@/features/employee-closeouts/employee-portal-session";
import { buildEmployeePortalContext } from "./employee-portal-context.js";

export function useEmployeePortalState({
  employee = false,
  loggedInEmployeeId = "",
  staff = [],
  sessionUserId = "",
  activeBusinesses = [],
  storeChannelSettings = {},
  storeOperationalSettings = {},
  notebookTheme = "yellow",
  expenseCategories = [],
  lastCloseoutDates = {},
  todayDate = "",
  nextDay = (date) => date,
  initialEmployeeBusinessId = "",
  initialEmployeeThemeOverride = null,
}) {
  const [employeePage, setEmployeePage] = useState("closeouts");
  const [employeeBusinessId, setEmployeeBusinessId] = useState(initialEmployeeBusinessId);
  const [employeeThemeOverride, setEmployeeThemeOverride] = useState(initialEmployeeThemeOverride);
  const [employeeEntryActive, setEmployeeEntryActive] = useState(false);
  const employeeAddHandlerRef = useRef(() => {});
  const employeeSettingsOpenerRef = useRef(() => {});

  const {
    activeEmployee,
    assignedEmployeeBusinesses,
    currentEmployeeBusiness,
    currentEmployeeChannelConfig,
    currentEmployeeOperationalConfig,
    currentEmployeeCategories,
    employeeNotebookTheme,
    suggestedEntryDate,
    assignedEmployeeBusinessIds,
  } = useMemo(
    () => buildEmployeePortalContext({
      employee,
      loggedInEmployeeId,
      staff,
      sessionUserId,
      activeBusinesses,
      employeeBusinessId,
      storeChannelSettings,
      storeOperationalSettings,
      notebookTheme,
      employeeThemeOverride,
      expenseCategories,
      lastCloseoutDates,
      todayDate,
      nextDay,
    }),
    [
      activeBusinesses,
      employee,
      employeeBusinessId,
      employeeThemeOverride,
      expenseCategories,
      lastCloseoutDates,
      loggedInEmployeeId,
      nextDay,
      notebookTheme,
      sessionUserId,
      staff,
      storeChannelSettings,
      storeOperationalSettings,
      todayDate,
    ],
  );

  useEffect(() => {
    const nextBusinessId = resolveEmployeeBusinessId(assignedEmployeeBusinesses, employeeBusinessId);
    if (nextBusinessId !== employeeBusinessId) setEmployeeBusinessId(nextBusinessId);
  }, [assignedEmployeeBusinesses, employeeBusinessId]);

  const changeEmployeePage = useCallback((page) => {
    setEmployeePage(page === "home" ? "closeouts" : page);
  }, []);

  return {
    employeePage,
    setEmployeePage,
    changeEmployeePage,
    employeeBusinessId,
    setEmployeeBusinessId,
    employeeThemeOverride,
    setEmployeeThemeOverride,
    employeeEntryActive,
    setEmployeeEntryActive,
    employeeAddHandlerRef,
    employeeSettingsOpenerRef,
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
