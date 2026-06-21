"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isValidNotebookTheme } from "@/features/daily-closeouts/notebook-themes";
import type { NotebookThemeId } from "@/features/daily-closeouts/daily-closeouts-types";
import {
  fetchEmployeePreferencesViaApi,
  saveEmployeePreferencesViaApi,
} from "./employee-preferences-api-client";
import type { UseEmployeePreferencesFromApiProps } from "@/features/runtime-settings/client/runtime-settings-client-types";

function resolveEmployeePreferencesLoadError(lang: string): string {
  return lang === "ar"
    ? "تعذر تحميل إعداداتك من الخادم."
    : "Failed to load your preferences from the server.";
}

function resolveEmployeePreferencesSaveError(lang: string): string {
  return lang === "ar"
    ? "تعذر حفظ إعداداتك على الخادم."
    : "Failed to save your preferences on the server.";
}

export function useEmployeePreferencesFromApi({
  enabled = false,
  loggedIn = false,
  isEmployee = false,
  lang = "ar",
  onHydrateTheme = () => {},
}: UseEmployeePreferencesFromApiProps = {}) {
  const hydratedRef = useRef(!enabled);
  const [syncError, setSyncError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!enabled || !loggedIn || !isEmployee) {
      hydratedRef.current = !enabled;
      setSyncError("");
      return undefined;
    }

    let cancelled = false;
    fetchEmployeePreferencesViaApi()
      .then((payload) => {
        if (cancelled) return;
        const notebookTheme = payload?.preferences?.notebookTheme;
        if (isValidNotebookTheme(notebookTheme)) {
          onHydrateTheme(notebookTheme);
        }
        hydratedRef.current = true;
        setSyncError("");
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn("employee preferences load failed", error);
        setSyncError(resolveEmployeePreferencesLoadError(lang));
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, isEmployee, lang, loggedIn, onHydrateTheme]);

  const persistNotebookTheme = useCallback(async (notebookTheme: NotebookThemeId | string) => {
    if (!enabled || !loggedIn || !isEmployee) return null;
    if (!isValidNotebookTheme(notebookTheme)) {
      throw new Error("Invalid notebook theme.");
    }

    setSaving(true);
    try {
      const saved = await saveEmployeePreferencesViaApi({ preferences: { notebookTheme } });
      const nextTheme = saved?.preferences?.notebookTheme;
      if (isValidNotebookTheme(nextTheme)) {
        onHydrateTheme(nextTheme);
      } else {
        onHydrateTheme(notebookTheme);
      }
      setSyncError("");
      return saved;
    } catch (error) {
      console.warn("employee preferences save failed", error);
      setSyncError(resolveEmployeePreferencesSaveError(lang));
      throw error;
    } finally {
      setSaving(false);
    }
  }, [enabled, isEmployee, lang, loggedIn, onHydrateTheme]);

  return {
    syncError,
    saving,
    hydrated: hydratedRef.current,
    persistNotebookTheme,
  };
}
