import { normalizeStoreOperationalSettings } from "@/domain/store-operational-settings/normalize";

export const DISABLE_REVIEW_ALERTS_MIGRATION_KEY = "disableReviewAlertsV1";
export const OWNER_SETTINGS_STORAGE_KEY = "taqfeelah_owner_settings";

export function migrateSavedSettingsBlob(
  raw: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null | undefined {
  if (!raw || typeof raw !== "object") return raw;

  if (raw.storeOperationalSettings && typeof raw.storeOperationalSettings === "object") {
    return {
      ...raw,
      storeOperationalSettings: Object.fromEntries(
        Object.entries(raw.storeOperationalSettings as Record<string, unknown>).map(([id, cfg]) => [
          id,
          normalizeStoreOperationalSettings(cfg),
        ]),
      ),
    };
  }

  return raw;
}

export type MigrateSavedSettingsOptions = {
  skip?: boolean;
  persistMigrated?: (migrated: Record<string, unknown>) => void;
  clearCloseoutAlerts?: () => void;
  resolveCloseouts?: () => void;
};

export function migrateSavedSettings(
  raw: Record<string, unknown> | null | undefined,
  {
    skip = false,
    persistMigrated,
    clearCloseoutAlerts,
    resolveCloseouts,
  }: MigrateSavedSettingsOptions = {},
): Record<string, unknown> | null | undefined {
  if (!raw || skip) return raw;

  const migrated = migrateSavedSettingsBlob(raw);
  if (migrated === raw) return raw;

  if (typeof persistMigrated === "function" && migrated) {
    persistMigrated(migrated);
  }
  if (typeof clearCloseoutAlerts === "function") {
    clearCloseoutAlerts();
  }
  if (typeof resolveCloseouts === "function") {
    resolveCloseouts();
  }

  return migrated;
}
