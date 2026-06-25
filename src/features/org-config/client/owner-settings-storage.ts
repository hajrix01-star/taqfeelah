import { readLocalStorageJson } from "@/features/demo/prototype-storage";
import { PROTOTYPE_DEMO_LAST_CLOSEOUT_KEY } from "@/features/demo/prototype-month-demo-seed";

export const LAST_CLOSEOUT_STORAGE_KEY = PROTOTYPE_DEMO_LAST_CLOSEOUT_KEY;

export function readDemoLastCloseoutDates(skipDemoDefaults = false) {
  if (skipDemoDefaults) return {};
  const stored = readLocalStorageJson(LAST_CLOSEOUT_STORAGE_KEY, null);
  if (stored && typeof stored === "object" && !Array.isArray(stored)) return stored;
  return { shami: "2026-06-02", arz: "2026-06-02" };
}
