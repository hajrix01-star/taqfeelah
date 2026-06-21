import { resolveRuntimeCapabilities } from "@/core/config/runtime-capabilities";
import { resolveSupportWhatsAppNumber } from "@/core/config/marketing-support";
import { createMigrateSavedSettings, createReadSavedSettings } from "@/features/org-config/client/owner-settings-bootstrap";
import { OWNER_SETTINGS_STORAGE_KEY } from "@/features/runtime-settings/client/migrate-local-saved-settings";
import { CLOSEOUT_ALERTS_STORAGE_KEY } from "@/features/owner-shell/client/owner-shell-storage";
import { migrateSavedSettings as applyLocalSavedSettingsMigration } from "@/features/runtime-settings/client/migrate-local-saved-settings";
import { loadLocalCloseoutsOnBoot } from "@/features/daily-closeouts/daily-closeouts-demo-store";
import { PROTOTYPE_DEMO_OPERATIONAL_ENTRIES_KEY } from "@/features/demo/prototype-month-demo-seed";
import { buildPrototypeDefaultStaff } from "@/features/demo/prototype-auth-boot";

const {
  appInProductionMode: APP_IN_PRODUCTION_MODE,
  bindsToServerAuth: BINDS_TO_SERVER_AUTH,
  entriesApiDbSource: ENTRIES_API_DB_SOURCE,
  registerEntriesPaginationEnabled: REGISTER_ENTRIES_PAGINATION_ENABLED,
  closeoutsApiDbSource: CLOSEOUTS_API_DB_SOURCE,
  runtimeSettingsDbSource: RUNTIME_SETTINGS_DB_SOURCE,
  orgConfigApiEnabled: ORG_CONFIG_API_ENABLED,
} = resolveRuntimeCapabilities();

const PROTOTYPE_SUPPORT_WHATSAPP = resolveSupportWhatsAppNumber();
const PROTOTYPE_DEMO_OTP = process.env.NEXT_PUBLIC_DEMO_OTP || (APP_IN_PRODUCTION_MODE ? "" : "1234");
const PROTOTYPE_OWNER_USERNAME = (
  process.env.NEXT_PUBLIC_DEMO_OWNER_USERNAME || (APP_IN_PRODUCTION_MODE ? "hajri" : "owner")
).trim().toLowerCase();
const PROTOTYPE_OWNER_PASSWORD = process.env.NEXT_PUBLIC_DEMO_OWNER_PASSWORD || (APP_IN_PRODUCTION_MODE ? "" : "demo123");
const PROTOTYPE_EMPLOYEE_PIN_DEFAULT = process.env.NEXT_PUBLIC_DEMO_EMPLOYEE_PIN_DEFAULT || (APP_IN_PRODUCTION_MODE ? "" : "1234");
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
const OPERATIONAL_ENTRIES_STORAGE_KEY = PROTOTYPE_DEMO_OPERATIONAL_ENTRIES_KEY;

const PROTOTYPE_DEFAULT_STAFF = buildPrototypeDefaultStaff(PROTOTYPE_EMPLOYEE_PIN_DEFAULT);

export {
  APP_IN_PRODUCTION_MODE,
  BINDS_TO_SERVER_AUTH,
  ENTRIES_API_DB_SOURCE,
  REGISTER_ENTRIES_PAGINATION_ENABLED,
  CLOSEOUTS_API_DB_SOURCE,
  RUNTIME_SETTINGS_DB_SOURCE,
  ORG_CONFIG_API_ENABLED,
  PROTOTYPE_SUPPORT_WHATSAPP,
  PROTOTYPE_DEMO_OTP,
  PROTOTYPE_OWNER_USERNAME,
  PROTOTYPE_OWNER_PASSWORD,
  PROTOTYPE_EMPLOYEE_PIN_DEFAULT,
  migrateSavedSettings,
  readSavedSettings,
  OPERATIONAL_ENTRIES_STORAGE_KEY,
  PROTOTYPE_DEFAULT_STAFF,
};
