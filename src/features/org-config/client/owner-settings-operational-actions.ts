import type { StoreOperationalDraft } from "./org-config-client-types";

export function cloneStoreOperationalDraft(config: StoreOperationalDraft): StoreOperationalDraft {
  return {
    ...config,
    activeCategories: [...config.activeCategories],
  };
}

export function isLastActiveOperationalCategory(config: StoreOperationalDraft, categoryId: string) {
  return config.activeCategories.includes(categoryId) && config.activeCategories.length === 1;
}

export function toggleOperationalCategory(config: StoreOperationalDraft, categoryId: string) {
  if (isLastActiveOperationalCategory(config, categoryId)) {
    return { config, blocked: true };
  }

  const activeCategories = config.activeCategories.includes(categoryId)
    ? config.activeCategories.filter((id) => id !== categoryId)
    : [...config.activeCategories, categoryId];

  return {
    config: { ...config, activeCategories },
    blocked: false,
  };
}

export function mergeOperationalDraft(
  config: StoreOperationalDraft,
  updates: Record<string, unknown>,
): StoreOperationalDraft {
  return { ...config, ...updates };
}
