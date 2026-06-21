import { OWNER_SETTINGS_STORAGE_KEY } from "./migrate-local-saved-settings";
import { isBrowserPersistentStorageAllowed } from "@/core/config/browser-persistence-policy";
import type { ReadLocalSavedSettingsOptions } from "@/features/runtime-settings/client/runtime-settings-client-types";

export function readLocalSavedSettingsRaw(
  storageKey = OWNER_SETTINGS_STORAGE_KEY,
): Record<string, unknown> | null {
  if (!isBrowserPersistentStorageAllowed({ scope: "legacy-settings" })) return null;
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem(storageKey) || "null") as Record<string, unknown> | null;
  } catch {
    return null;
  }
}

export function readLocalSavedSettings({
  enabled = true,
  migrate,
  storageKey = OWNER_SETTINGS_STORAGE_KEY,
}: ReadLocalSavedSettingsOptions = {}): Record<string, unknown> | null {
  if (!enabled || typeof window === "undefined") return null;
  const raw = readLocalSavedSettingsRaw(storageKey);
  if (typeof migrate === "function") {
    return migrate(raw);
  }
  return raw;
}
