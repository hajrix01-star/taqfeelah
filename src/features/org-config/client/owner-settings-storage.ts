import { readLocalStorageJson } from "@/core/client/safe-local-storage";

export const LAST_CLOSEOUT_STORAGE_KEY = "taqfeelah_last_closeout_dates_v4_month_demo";

export function readLocalLastCloseoutDates(skipLocalDefaults = false) {
  if (skipLocalDefaults) return {};
  const stored = readLocalStorageJson(LAST_CLOSEOUT_STORAGE_KEY, null);
  if (stored && typeof stored === "object" && !Array.isArray(stored)) return stored;
  return { shami: "2026-06-02", arz: "2026-06-02" };
}
