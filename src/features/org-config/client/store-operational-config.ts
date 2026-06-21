import { defaultStoreOperationalSettings, normalizeStoreOperationalSettings } from "@/domain/store-operational-settings/normalize";
import { DEFAULT_EXPENSE_CATEGORY_IDS } from "@/domain/store-operational-settings/types";

export function getStoreOperationalConfig(
  settings: Record<string, unknown> | null | undefined,
  storeId: string,
) {
  const stored = settings?.[storeId];
  if (!stored) return defaultStoreOperationalSettings();
  return normalizeStoreOperationalSettings(stored);
}

export function buildInitialStoreOperationalSettings(
  savedSettings: Record<string, unknown> | null | undefined,
  storeList: Array<{ id: string } & Record<string, unknown>>,
) {
  if (savedSettings?.storeOperationalSettings) {
    return Object.fromEntries(
      Object.entries(savedSettings.storeOperationalSettings as Record<string, unknown>).map(([storeId, config]) => [
        storeId,
        normalizeStoreOperationalSettings(config),
      ]),
    );
  }

  const legacy = normalizeStoreOperationalSettings({
    activeCategories: (savedSettings?.activeCategories as string[] | undefined) || [...DEFAULT_EXPENSE_CATEGORY_IDS],
    employeeHistoryVisibility: savedSettings?.employeeHistoryVisibility,
    closeoutAlert: savedSettings?.closeoutAlert,
    notebookTheme: savedSettings?.notebookTheme,
  });

  return Object.fromEntries(
    (storeList || []).map((business) => [
      business.id,
      {
        ...legacy,
        activeCategories: [...legacy.activeCategories],
      },
    ]),
  );
}

export function ensureStoreOperationalSettingsForBusinesses(
  current: Record<string, unknown>,
  businessIds: string[],
) {
  let changed = false;
  const next = { ...current };

  businessIds.forEach((businessId) => {
    if (!next[businessId]) {
      next[businessId] = getStoreOperationalConfig({}, businessId);
      changed = true;
    }
  });

  return changed ? next : current;
}

export function buildStoreOperationalPolicy(settings: Record<string, unknown>) {
  return {
    closeoutAlertEnabledForBusiness: (businessId: string) => (
      getStoreOperationalConfig(settings, businessId).closeoutAlert
    ),
  };
}
