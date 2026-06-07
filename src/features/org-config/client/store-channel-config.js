/**
 * @typedef {Object} StoreChannelConfig
 * @property {Array<Record<string, unknown>>} channels
 * @property {string[]} activeIds
 */

/**
 * @param {Record<string, StoreChannelConfig | undefined>} settings
 * @param {string | null | undefined} storeId
 * @param {StoreChannelConfig} defaultConfig
 * @returns {StoreChannelConfig}
 */
export function getStoreChannelConfig(settings, storeId, defaultConfig) {
  if (!storeId) return defaultConfig;
  return settings?.[storeId] || defaultConfig;
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
