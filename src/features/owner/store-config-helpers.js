/**
 * Store channel and operational settings helpers.
 * Used by OwnerSettingsScreen, OwnerRegisterScreen, and the main runtime.
 */

export const DEFAULT_ACTIVE_CATEGORIES = ["rent", "salary", "utility", "phone", "maintenance", "other"];

export const DEFAULT_CHANNEL_IDS = ["cash", "mada"];

export function getStoreOperationalConfig(settings, storeId) {
  const stored = settings?.[storeId] || {};
  return {
    reviewEnabled: Boolean(stored.reviewEnabled),
    attachmentAlert: Boolean(stored.attachmentAlert),
    closeoutAlert: stored.closeoutAlert !== undefined ? Boolean(stored.closeoutAlert) : false,
    closeoutReviewEnabled: Boolean(stored.closeoutReviewEnabled),
    employeeHistoryVisibility: stored.employeeHistoryVisibility || "all",
    notebookTheme: stored.notebookTheme || null,
    activeCategories: Array.isArray(stored.activeCategories) ? stored.activeCategories : DEFAULT_ACTIVE_CATEGORIES,
  };
}

export function buildInitialStoreOperationalSettings(savedSettings, storeList) {
  if (savedSettings?.storeOperationalSettings) return savedSettings.storeOperationalSettings;
  return Object.fromEntries((storeList || []).map((store) => [store.id, {}]));
}

export function getStoreChannelConfig(settings, storeId) {
  const stored = settings?.[storeId] || {};
  const channels = Array.isArray(stored.channels) ? stored.channels : [];
  const activeIds = Array.isArray(stored.activeIds) ? stored.activeIds : DEFAULT_CHANNEL_IDS;
  return { channels, activeIds };
}

export function buildInitialStoreChannelSettings(savedSettings, storeList) {
  if (savedSettings?.storeChannelSettings) return savedSettings.storeChannelSettings;
  return Object.fromEntries((storeList || []).map((store) => [store.id, {}]));
}
