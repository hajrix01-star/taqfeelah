import { readLocalSavedSettings } from "@/features/runtime-settings/client/read-local-saved-settings";
import { isBrowserPersistentStorageAllowed } from "@/core/config/browser-persistence-policy";

export function createMigrateSavedSettings({
  bindsToServerAuth,
  storageKey,
  closeoutAlertsKey,
  applyMigration,
  autoResolveCloseouts,
}: {
  bindsToServerAuth: boolean;
  storageKey: string;
  closeoutAlertsKey: string;
  applyMigration: (raw: unknown, options: Record<string, unknown>) => unknown;
  autoResolveCloseouts: (resolveCloseouts: () => void) => void;
}) {
  return function migrateSavedSettings(raw: unknown) {
    if (
      !raw
      || typeof window === "undefined"
      || bindsToServerAuth
      || !isBrowserPersistentStorageAllowed({ scope: "legacy-settings" })
    ) {
      return raw;
    }
    return applyMigration(raw, {
      skip: false,
      persistMigrated: (migrated: unknown) => {
        window.localStorage.setItem(storageKey, JSON.stringify(migrated));
      },
      clearCloseoutAlerts: () => {
        window.localStorage.removeItem(closeoutAlertsKey);
      },
      resolveCloseouts: () => {
        autoResolveCloseouts(() => false);
      },
    });
  };
}

export function createReadSavedSettings({
  enabled,
  migrate,
}: {
  enabled: boolean;
  migrate: (raw: unknown) => unknown;
}) {
  return function readSavedSettings(): Record<string, unknown> | null {
    return readLocalSavedSettings({
      enabled,
      migrate: migrate as (raw: Record<string, unknown> | null) => Record<string, unknown> | null,
    }) as Record<string, unknown> | null;
  };
}
