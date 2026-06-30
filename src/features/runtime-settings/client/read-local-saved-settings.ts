import { OWNER_SETTINGS_STORAGE_KEY } from "./migrate-local-saved-settings";
import { readLocalStorageJson } from "@/core/client/safe-local-storage";
import type { ReadLocalSavedSettingsOptions } from "@/features/runtime-settings/client/runtime-settings-client-types";

export function readLocalSavedSettingsRaw(
  storageKey = OWNER_SETTINGS_STORAGE_KEY,
): Record<string, unknown> | null {
  return readLocalStorageJson<Record<string, unknown> | null>(storageKey, null, {
    scope: "local-settings-migration",
  });
}

export function readLocalSavedSettings({
  enabled = true,
  migrate,
  storageKey = OWNER_SETTINGS_STORAGE_KEY,
}: ReadLocalSavedSettingsOptions = {}): Record<string, unknown> | null {
  if (!enabled) return null;
  const raw = readLocalSavedSettingsRaw(storageKey);
  if (typeof migrate === "function") {
    return migrate(raw);
  }
  return raw;
}
