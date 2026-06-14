type OwnerSettingsStoreLayoutEnv = {
  NEXT_PUBLIC_OWNER_SETTINGS_FLATTENED_STORE?: string;
};

/**
 * Flattened store settings (proposal A): one scrollable page with accordions
 * instead of overview → sub-panel drill-down.
 *
 * Rollback: set NEXT_PUBLIC_OWNER_SETTINGS_FLATTENED_STORE=false and rebuild.
 * Legacy drill-down remains in code behind this flag.
 */
export function isFlattenedStoreSettingsEnabled(
  env: OwnerSettingsStoreLayoutEnv = process.env as OwnerSettingsStoreLayoutEnv,
): boolean {
  const raw = env.NEXT_PUBLIC_OWNER_SETTINGS_FLATTENED_STORE;
  if (raw === "false") return false;
  return true;
}
