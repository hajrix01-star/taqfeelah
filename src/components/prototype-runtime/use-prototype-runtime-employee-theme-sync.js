"use client";

import { useCallback, useEffect } from "react";
import { isValidNotebookTheme } from "@/features/daily-closeouts/notebook-themes";
import { writeEmployeeNotebookTheme } from "@/features/employee-closeouts/employee-theme-storage";
import { useEmployeePreferencesFromApi } from "@/features/runtime-settings/client/use-employee-preferences-from-api";
import { usesRuntimeSettingsApi } from "@/core/config/runtime-capabilities";

export function usePrototypeRuntimeEmployeeThemeSync({
  employee,
  loggedIn,
  employeeRuntimeReady,
  lang,
  sessionUserId,
  activeEmployee,
  employeePreferences,
  setEmployeePreferences,
  employeeThemeOverride,
  setEmployeeThemeOverride,
}) {
  const employeePreferenceUserId = sessionUserId || activeEmployee?.apiUserId || activeEmployee?.id || "";
  const employeePreferencesApiEnabled = usesRuntimeSettingsApi();

  const hydrateEmployeeThemeFromApi = useCallback((theme) => {
    if (isValidNotebookTheme(theme)) {
      setEmployeeThemeOverride(theme);
    }
  }, [setEmployeeThemeOverride]);

  const {
    syncError: employeePreferencesSyncError,
    persistNotebookTheme,
  } = useEmployeePreferencesFromApi({
    enabled: employeePreferencesApiEnabled && employee && loggedIn && employeeRuntimeReady,
    loggedIn,
    isEmployee: employee,
    lang,
    onHydrateTheme: hydrateEmployeeThemeFromApi,
  });

  const activeEmployeePreferenceTheme = employeePreferenceUserId
    ? employeePreferences?.[employeePreferenceUserId]?.notebookTheme
    : null;

  useEffect(() => {
    if (employeePreferencesApiEnabled) return;
    if (!isValidNotebookTheme(activeEmployeePreferenceTheme)) return;
    if (employeeThemeOverride === activeEmployeePreferenceTheme) return;
    setEmployeeThemeOverride(activeEmployeePreferenceTheme);
  }, [activeEmployeePreferenceTheme, employeePreferencesApiEnabled, employeeThemeOverride, setEmployeeThemeOverride]);

  useEffect(() => {
    if (employeePreferencesApiEnabled) return;
    if (!employeePreferenceUserId || !isValidNotebookTheme(employeeThemeOverride)) return;
    if (
      isValidNotebookTheme(activeEmployeePreferenceTheme)
      && activeEmployeePreferenceTheme !== employeeThemeOverride
    ) return;
    if (employeePreferences?.[employeePreferenceUserId]?.notebookTheme === employeeThemeOverride) return;
    setEmployeePreferences((current) => ({
      ...(current || {}),
      [employeePreferenceUserId]: {
        ...((current || {})[employeePreferenceUserId] || {}),
        notebookTheme: employeeThemeOverride,
      },
    }));
  }, [
    activeEmployeePreferenceTheme,
    employeePreferenceUserId,
    employeePreferences,
    employeePreferencesApiEnabled,
    employeeThemeOverride,
    setEmployeePreferences,
  ]);

  const handleEmployeeNotebookThemeSave = useCallback((theme) => {
    setEmployeeThemeOverride(theme);
    if (employeePreferencesApiEnabled) {
      void persistNotebookTheme(theme);
      return;
    }
    const storageKey = activeEmployee?.id || employeePreferenceUserId;
    if (storageKey) writeEmployeeNotebookTheme(storageKey, theme);
  }, [
    activeEmployee?.id,
    employeePreferenceUserId,
    employeePreferencesApiEnabled,
    persistNotebookTheme,
    setEmployeeThemeOverride,
  ]);

  return {
    employeePreferencesSyncError,
    handleEmployeeNotebookThemeSave,
  };
}
