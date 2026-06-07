/**
 * @typedef {Object} StoreChannelConfig
 * @property {Array<Record<string, unknown>>} channels
 * @property {string[]} activeIds
 */

/**
 * @param {StoreChannelConfig} config
 * @returns {StoreChannelConfig}
 */
export function cloneStoreChannelDraft(config) {
  return {
    ...config,
    channels: config.channels.map((channel) => ({ ...channel })),
    activeIds: [...config.activeIds],
  };
}

/**
 * @param {StoreChannelConfig} config
 * @param {string} channelId
 */
export function isLastActiveSalesChannel(config, channelId) {
  return config.activeIds.includes(channelId) && config.activeIds.length === 1;
}

/**
 * @param {StoreChannelConfig} config
 * @param {string} channelId
 */
export function toggleSalesChannelActive(config, channelId) {
  if (isLastActiveSalesChannel(config, channelId)) {
    return { config, blocked: true };
  }

  const activeIds = config.activeIds.includes(channelId)
    ? config.activeIds.filter((id) => id !== channelId)
    : [...config.activeIds, channelId];

  return {
    config: { ...config, activeIds },
    blocked: false,
  };
}

/**
 * @param {StoreChannelConfig} config
 * @param {{ id: string }} channel
 */
export function canRequestRetireSalesChannel(config, channel) {
  return !isLastActiveSalesChannel(config, channel.id);
}

/**
 * @param {StoreChannelConfig} config
 * @param {{ id: string }} channel
 * @returns {StoreChannelConfig}
 */
export function restoreRetiredSalesChannel(config, channel) {
  return {
    channels: config.channels.map((item) => (
      item.id === channel.id ? { ...item, retired: false } : item
    )),
    activeIds: config.activeIds.includes(channel.id)
      ? config.activeIds
      : [...config.activeIds, channel.id],
  };
}

/**
 * @param {StoreChannelConfig} config
 * @param {{ id: string }} channel
 * @returns {StoreChannelConfig}
 */
export function retireSalesChannelInDraft(config, channel) {
  return {
    activeIds: config.activeIds.filter((id) => id !== channel.id),
    channels: config.channels.map((item) => (
      item.id === channel.id ? { ...item, retired: true } : item
    )),
  };
}

/**
 * @param {StoreChannelConfig} config
 * @param {string} name
 * @param {{ id?: string, icon?: unknown }} [options]
 */
export function addCustomSalesChannel(config, name, options = {}) {
  const trimmed = name.trim();
  if (!trimmed) {
    return { config, added: false, channelId: "" };
  }

  const channelId = options.id || `channel-${Date.now()}`;
  return {
    config: {
      channels: [
        ...config.channels,
        {
          id: channelId,
          custom: true,
          nameAr: trimmed,
          nameEn: trimmed,
          icon: options.icon,
        },
      ],
      activeIds: [...config.activeIds, channelId],
    },
    added: true,
    channelId,
  };
}
