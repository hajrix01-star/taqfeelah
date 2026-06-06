import { defaultStoreOperationalSettings, normalizeStoreOperationalSettings } from "@/domain/store-operational-settings/normalize";
import { DEFAULT_EXPENSE_CATEGORY_IDS } from "@/domain/store-operational-settings/types";

export function getStoreOperationalConfig(settings, storeId) {
  const stored = settings?.[storeId];
  if (!stored) return defaultStoreOperationalSettings();
  return normalizeStoreOperationalSettings(stored);
}

export function buildInitialStoreOperationalSettings(savedSettings, storeList) {
  if (savedSettings?.storeOperationalSettings) {
    return Object.fromEntries(
      Object.entries(savedSettings.storeOperationalSettings).map(([storeId, config]) => [
        storeId,
        normalizeStoreOperationalSettings(config),
      ]),
    );
  }

  const legacy = normalizeStoreOperationalSettings({
    activeCategories: savedSettings?.activeCategories || [...DEFAULT_EXPENSE_CATEGORY_IDS],
    reviewEnabled: savedSettings?.reviewEnabled,
    closeoutReviewEnabled: savedSettings?.closeoutReviewEnabled,
    employeeHistoryVisibility: savedSettings?.employeeHistoryVisibility,
    closeoutAlert: savedSettings?.closeoutAlert,
    attachmentAlert: savedSettings?.attachmentAlert,
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

export function buildStoreOperationalPolicy(settings) {
  return {
    reviewEnabledForBusiness: (businessId) => getStoreOperationalConfig(settings, businessId).reviewEnabled,
    closeoutReviewEnabledForBusiness: (businessId) => (
      Boolean(getStoreOperationalConfig(settings, businessId).closeoutReviewEnabled)
    ),
    attachmentAlertEnabledForBusiness: (businessId) => {
      const config = getStoreOperationalConfig(settings, businessId);
      return config.reviewEnabled && config.attachmentAlert;
    },
    closeoutAlertEnabledForBusiness: (businessId) => (
      getStoreOperationalConfig(settings, businessId).closeoutAlert
    ),
  };
}
