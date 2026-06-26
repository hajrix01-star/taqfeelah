import { resolveRuntimeCapabilities } from "@/core/config/runtime-capabilities";
import { resolveSupportWhatsAppNumber } from "@/core/config/marketing-support";
import { createMigrateSavedSettings, createReadSavedSettings } from "@/features/org-config/client/owner-settings-bootstrap";
import { OWNER_SETTINGS_STORAGE_KEY } from "@/features/runtime-settings/client/migrate-local-saved-settings";
import { CLOSEOUT_ALERTS_STORAGE_KEY } from "@/features/owner-shell/client/owner-shell-storage";
import { migrateSavedSettings as applyLocalSavedSettingsMigration } from "@/features/runtime-settings/client/migrate-local-saved-settings";
import { loadLocalCloseoutsOnBoot } from "@/features/daily-closeouts/daily-closeouts-local-store";
import type { AuthStaffMember } from "@/features/auth/client/auth-client-types";

const {
  appInProductionMode: APP_IN_PRODUCTION_MODE,
  bindsToServerAuth: BINDS_TO_SERVER_AUTH,
  entriesApiDbSource: ENTRIES_API_DB_SOURCE,
  registerEntriesPaginationEnabled: REGISTER_ENTRIES_PAGINATION_ENABLED,
  closeoutsApiDbSource: CLOSEOUTS_API_DB_SOURCE,
  runtimeSettingsDbSource: RUNTIME_SETTINGS_DB_SOURCE,
  orgConfigApiEnabled: ORG_CONFIG_API_ENABLED,
} = resolveRuntimeCapabilities();

const SUPPORT_WHATSAPP = resolveSupportWhatsAppNumber();
const LOCAL_DEV_OTP = process.env.NEXT_PUBLIC_LOCAL_DEV_OTP || (APP_IN_PRODUCTION_MODE ? "" : "1234");
const LOCAL_DEV_OWNER_USERNAME = (
  process.env.NEXT_PUBLIC_LOCAL_DEV_OWNER_USERNAME || (APP_IN_PRODUCTION_MODE ? "hajri" : "owner")
).trim().toLowerCase();
const LOCAL_DEV_OWNER_PASSWORD = process.env.NEXT_PUBLIC_LOCAL_DEV_OWNER_PASSWORD || (APP_IN_PRODUCTION_MODE ? "" : "local123");
const LOCAL_DEV_EMPLOYEE_PIN_DEFAULT = process.env.NEXT_PUBLIC_LOCAL_DEV_EMPLOYEE_PIN_DEFAULT || (APP_IN_PRODUCTION_MODE ? "" : "1234");
const migrateSavedSettings = createMigrateSavedSettings({
  bindsToServerAuth: BINDS_TO_SERVER_AUTH,
  storageKey: OWNER_SETTINGS_STORAGE_KEY,
  closeoutAlertsKey: CLOSEOUT_ALERTS_STORAGE_KEY,
  applyMigration: applyLocalSavedSettingsMigration as (
    raw: unknown,
    options: Record<string, unknown>,
  ) => unknown,
  autoResolveCloseouts: loadLocalCloseoutsOnBoot,
});
const readSavedSettings = createReadSavedSettings({
  enabled: !BINDS_TO_SERVER_AUTH && !RUNTIME_SETTINGS_DB_SOURCE,
  migrate: migrateSavedSettings,
});
const DEFAULT_STAFF: AuthStaffMember[] = [];

export {
  APP_IN_PRODUCTION_MODE,
  BINDS_TO_SERVER_AUTH,
  ENTRIES_API_DB_SOURCE,
  REGISTER_ENTRIES_PAGINATION_ENABLED,
  CLOSEOUTS_API_DB_SOURCE,
  RUNTIME_SETTINGS_DB_SOURCE,
  ORG_CONFIG_API_ENABLED,
  SUPPORT_WHATSAPP,
  LOCAL_DEV_OTP,
  LOCAL_DEV_OWNER_USERNAME,
  LOCAL_DEV_OWNER_PASSWORD,
  LOCAL_DEV_EMPLOYEE_PIN_DEFAULT,
  migrateSavedSettings,
  readSavedSettings,
  DEFAULT_STAFF,
};
