/**
 * Store channel and operational settings helpers.
 * Used by OwnerSettingsScreen, OwnerRegisterScreen, and the main runtime.
 */

export const DEFAULT_ACTIVE_CATEGORIES = [
  "rent", "salary", "utility", "phone", "maintenance", "other",
] as const;

export const DEFAULT_CHANNEL_IDS = ["cash", "mada"] as const;

export type StoreOperationalConfig = {
  reviewEnabled: boolean;
  attachmentAlert: boolean;
  closeoutAlert: boolean;
  closeoutReviewEnabled: boolean;
  employeeHistoryVisibility: "all" | "own" | "none";
  notebookTheme: string | null;
  activeCategories: string[];
};

export function getStoreOperationalConfig(
  settings: Record<string, Partial<StoreOperationalConfig>> | undefined,
  storeId: string | undefined | null,
): StoreOperationalConfig {
  const stored = (settings && storeId ? settings[storeId] : undefined) || {};
  return {
    reviewEnabled: Boolean(stored.reviewEnabled),
    attachmentAlert: Boolean(stored.attachmentAlert),
    closeoutAlert: stored.closeoutAlert !== undefined ? Boolean(stored.closeoutAlert) : false,
    closeoutReviewEnabled: Boolean(stored.closeoutReviewEnabled),
    employeeHistoryVisibility: (stored.employeeHistoryVisibility as "all" | "own" | "none") || "all",
    notebookTheme: stored.notebookTheme || null,
    activeCategories: Array.isArray(stored.activeCategories)
      ? stored.activeCategories
      : [...DEFAULT_ACTIVE_CATEGORIES],
  };
}

export function buildInitialStoreOperationalSettings(
  savedSettings: { storeOperationalSettings?: Record<string, unknown> } | null | undefined,
  storeList: { id: string }[],
): Record<string, Record<string, unknown>> {
  if (savedSettings?.storeOperationalSettings) {
    return savedSettings.storeOperationalSettings as Record<string, Record<string, unknown>>;
  }
  return Object.fromEntries((storeList || []).map((store) => [store.id, {}]));
}

export type StoreChannelConfig = {
  channels: unknown[];
  activeIds: string[];
};

export function getStoreChannelConfig(
  settings: Record<string, { channels?: unknown[]; activeIds?: string[] } | undefined> | undefined,
  storeId: string | undefined | null,
): StoreChannelConfig {
  const stored = (settings && storeId ? settings[storeId] : undefined) || {};
  const channels = Array.isArray(stored.channels) ? stored.channels : [];
  const activeIds = Array.isArray(stored.activeIds) ? stored.activeIds : [...DEFAULT_CHANNEL_IDS];
  return { channels, activeIds };
}

export function buildInitialStoreChannelSettings(
  savedSettings: { storeChannelSettings?: Record<string, unknown> } | null | undefined,
  storeList: { id: string }[],
): Record<string, Record<string, unknown>> {
  if (savedSettings?.storeChannelSettings) {
    return savedSettings.storeChannelSettings as Record<string, Record<string, unknown>>;
  }
  return Object.fromEntries((storeList || []).map((store) => [store.id, {}]));
}
