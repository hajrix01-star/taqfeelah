/**
 * @typedef {Object} StoreChannelConfig
 * @property {Array<Record<string, unknown>>} channels
 * @property {string[]} activeIds
 */

export const EMPTY_STORE_CHANNEL_CONFIG = Object.freeze({
  channels: [],
  activeIds: [],
});

function normalizeStoreChannelConfig(config, fallback = EMPTY_STORE_CHANNEL_CONFIG) {
  if (!config || !Array.isArray(config.channels) || !Array.isArray(config.activeIds)) {
    return fallback;
  }
  return config;
}

/**
 * @param {Record<string, StoreChannelConfig | undefined>} settings
 * @param {string | null | undefined} storeId
 * @param {StoreChannelConfig} [defaultConfig]
 * @returns {StoreChannelConfig}
 */
export function getStoreChannelConfig(settings, storeId, defaultConfig = EMPTY_STORE_CHANNEL_CONFIG) {
  if (!storeId) return normalizeStoreChannelConfig(defaultConfig);
  return normalizeStoreChannelConfig(settings?.[storeId], normalizeStoreChannelConfig(defaultConfig));
}

/**
 * @param {Array<{ id: string }>} defaultChannels
 * @returns {StoreChannelConfig}
 */
export function createDefaultStoreChannelConfig(defaultChannels) {
  return {
    channels: defaultChannels.map((channel) => ({ ...channel })),
    activeIds: defaultChannels.map((channel) => channel.id),
  };
}

/**
 * @param {Record<string, StoreChannelConfig | undefined>} settings
 * @param {string | null | undefined} storeId
 * @param {StoreChannelConfig} defaultConfig
 */
export function resolveStoreChannelConfig(settings, storeId, defaultConfig) {
  return getStoreChannelConfig(settings, storeId, defaultConfig);
}

/**
 * @param {Record<string, StoreChannelConfig>} current
 * @param {string[]} businessIds
 * @param {StoreChannelConfig} defaultConfig
 */
export function ensureStoreChannelSettingsForBusinesses(
  current,
  businessIds,
  defaultConfig,
  { allowPrototypeDefaults = true } = {},
) {
  let changed = false;
  const next = { ...current };

  businessIds.forEach((businessId) => {
    if (!next[businessId]) {
      next[businessId] = allowPrototypeDefaults
        ? {
          channels: defaultConfig.channels.map((channel) => ({ ...channel })),
          activeIds: [...defaultConfig.activeIds],
        }
        : {
          channels: [],
          activeIds: [],
        };
      changed = true;
    }
  });

  return changed ? next : current;
}

/**
 * @param {Record<string, unknown> | null | undefined} savedSettings
 * @param {Array<{ id: string }>} storeList
 * @param {StoreChannelConfig} defaultConfig
 */
export function buildInitialStoreChannelSettings(savedSettings, storeList, defaultConfig) {
  if (savedSettings?.storeChannelSettings) {
    return savedSettings.storeChannelSettings;
  }

  const legacyChannels = savedSettings?.configuredChannels || defaultConfig.channels;
  const legacyActiveIds = savedSettings?.activeChannels
    || legacyChannels.filter((channel) => !channel.retired).map((channel) => channel.id);

  return Object.fromEntries(
    (storeList || []).map((business) => [
      business.id,
      {
        channels: legacyChannels.map((channel) => ({ ...channel })),
        activeIds: [...legacyActiveIds],
      },
    ]),
  );
}
