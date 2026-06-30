"use client";

import { useEffect } from "react";
import { applyNotebookThemeCssVariables } from "@/features/daily-closeouts/notebook-themes";

export function useTaqfeelahNotebookThemeEffect({
  employee,
  employeeNotebookTheme,
  notebookTheme,
}: {
  employee: boolean;
  employeeNotebookTheme: string;
  notebookTheme: string;
}) {
  useEffect(() => {
    applyNotebookThemeCssVariables(employee ? employeeNotebookTheme : notebookTheme);
  }, [employee, employeeNotebookTheme, notebookTheme]);
}
