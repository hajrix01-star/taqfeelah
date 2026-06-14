/**
 * @typedef {Object} StoreChannelConfig
 * @property {Array<Record<string, unknown>>} channels
 * @property {string[]} activeIds
 */

import {
  getCatalogEntry,
  listCatalogByKind,
  resolveIncomeSourceKind,
} from "@/core/client/income-source-catalog";

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
 * @param {string} legacyId
 */
function channelExistsInConfig(config, legacyId) {
  return config.channels.some((channel) => (
    channel.legacyId === legacyId
    || channel.id === legacyId
    || channel.text === legacyId
  ));
}

/**
 * @param {StoreChannelConfig} config
 * @param {"payment_method" | "sales_channel"} kind
 */
export function listAddableCatalogSources(config, kind) {
  return listCatalogByKind(kind).filter((entry) => !channelExistsInConfig(config, entry.legacyId));
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
 * @param {string} legacyId
 * @param {{ icon?: unknown }} [options]
 */
export function addCatalogIncomeSource(config, legacyId, options = {}) {
  const entry = getCatalogEntry(legacyId);
  if (!entry || channelExistsInConfig(config, entry.legacyId)) {
    return { config, added: false, channelId: "" };
  }

  const channelId = entry.legacyId;
  return {
    config: {
      channels: [
        ...config.channels,
        {
          id: channelId,
          legacyId: entry.legacyId,
          text: entry.legacyId,
          kind: entry.kind,
          icon: options.icon,
          retired: false,
        },
      ],
      activeIds: [...config.activeIds, channelId],
    },
    added: true,
    channelId,
  };
}

/**
 * @param {StoreChannelConfig} config
 * @param {string} name
 * @param {{ id?: string, icon?: unknown, kind?: "payment_method" | "sales_channel" }} [options]
 */
export function addCustomSalesChannel(config, name, options = {}) {
  const trimmed = name.trim();
  if (!trimmed) {
    return { config, added: false, channelId: "" };
  }

  const channelId = options.id || `channel-${Date.now()}`;
  const kind = options.kind === "sales_channel" ? "sales_channel" : "payment_method";
  return {
    config: {
      channels: [
        ...config.channels,
        {
          id: channelId,
          custom: true,
          kind,
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

/**
 * @param {StoreChannelConfig} config
 * @param {"payment_method" | "sales_channel"} kind
 */
export function listConfiguredChannelsByKind(config, kind) {
  return config.channels.filter((channel) => !channel.retired && resolveIncomeSourceKind(channel) === kind);
}

/**
 * @param {StoreChannelConfig} config
 * @param {"payment_method" | "sales_channel"} kind
 */
export function listVisibleChannelsByKind(config, visibleChannels, kind) {
  return visibleChannels.filter((channel) => resolveIncomeSourceKind(channel) === kind);
}
