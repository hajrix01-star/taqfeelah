"use client";

import { useCallback, useEffect } from "react";
import { isValidNotebookTheme } from "@/features/daily-closeouts/notebook-themes";
import { writeEmployeeNotebookTheme } from "@/features/employee-closeouts/employee-theme-storage";
import { useEmployeePreferencesFromApi } from "@/features/runtime-settings/client/use-employee-preferences-from-api";
import { usesRuntimeSettingsApi } from "@/core/config/runtime-capabilities";
import type {
  NotebookThemeId,
  AppLang,
  AppSetState,
  AppStaffMember,
} from "./taqfeelah-app-types";

type EmployeePreferencesMap = Record<string, { notebookTheme?: NotebookThemeId | string; [key: string]: unknown }>;

type UseTaqfeelahAppEmployeeThemeSyncProps = {
  employee: boolean;
  loggedIn: boolean;
  employeeRuntimeReady: boolean;
  lang: AppLang;
  sessionUserId: string;
  activeEmployee: AppStaffMember | null;
  employeePreferences: EmployeePreferencesMap;
  setEmployeePreferences: AppSetState<EmployeePreferencesMap>;
  employeeThemeOverride: NotebookThemeId | string;
  setEmployeeThemeOverride: (theme: NotebookThemeId | string) => void;
};

export function useTaqfeelahAppEmployeeThemeSync({
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
}: UseTaqfeelahAppEmployeeThemeSyncProps) {
  const employeePreferenceUserId = sessionUserId || String(activeEmployee?.apiUserId || activeEmployee?.id || "");
  const employeePreferencesApiEnabled = usesRuntimeSettingsApi();

  const hydrateEmployeeThemeFromApi = useCallback((theme?: NotebookThemeId | string) => {
    if (theme && isValidNotebookTheme(theme)) {
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

  const handleEmployeeNotebookThemeSave = useCallback((theme: NotebookThemeId | string) => {
    setEmployeeThemeOverride(theme);
    if (employeePreferencesApiEnabled) {
      void persistNotebookTheme(theme);
      return;
    }
    const storageKey = activeEmployee?.id || employeePreferenceUserId;
    if (storageKey) writeEmployeeNotebookTheme(String(storageKey), theme);
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
