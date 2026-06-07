/**
 * @typedef {Object} StoreOperationalDraft
 * @property {string[]} activeCategories
 * @property {Record<string, unknown>} [key]
 */

/**
 * @param {StoreOperationalDraft} config
 * @returns {StoreOperationalDraft}
 */
export function cloneStoreOperationalDraft(config) {
  return {
    ...config,
    activeCategories: [...config.activeCategories],
  };
}

/**
 * @param {StoreOperationalDraft} config
 * @param {string} categoryId
 */
export function isLastActiveOperationalCategory(config, categoryId) {
  return config.activeCategories.includes(categoryId) && config.activeCategories.length === 1;
}

/**
 * @param {StoreOperationalDraft} config
 * @param {string} categoryId
 */
export function toggleOperationalCategory(config, categoryId) {
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

/**
 * @param {StoreOperationalDraft} config
 * @param {Record<string, unknown>} updates
 * @returns {StoreOperationalDraft}
 */
export function mergeOperationalDraft(config, updates) {
  return { ...config, ...updates };
}
