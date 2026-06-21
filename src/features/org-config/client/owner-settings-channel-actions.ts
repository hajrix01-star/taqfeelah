import {
  INCOME_SOURCE_CATALOG,
  catalogDisplayName,
  getCatalogEntry,
  listCatalogByKind,
  resolveIncomeSourceKind,
} from "@/core/client/income-source-catalog";
import type { StoreChannelConfig } from "./org-config-client-types";

export function cloneStoreChannelDraft(config: StoreChannelConfig): StoreChannelConfig {
  return {
    ...config,
    channels: config.channels.map((channel) => ({ ...channel })),
    activeIds: [...config.activeIds],
  };
}

function channelExistsInConfig(config: StoreChannelConfig, legacyId: string) {
  return Boolean(findConfiguredChannelByLegacyId(config, legacyId));
}

export function findConfiguredChannelByLegacyId(config: StoreChannelConfig, legacyId: string) {
  return config.channels.find((channel) => (
    channel.legacyId === legacyId
    || channel.id === legacyId
    || channel.text === legacyId
  ));
}

function isCatalogConfiguredChannel(channel: Record<string, unknown>) {
  const legacyId = String(
    channel?.legacyId
    || channel?.text
    || (typeof channel?.id === "string" ? channel.id : ""),
  ).trim();
  return Boolean(legacyId && getCatalogEntry(legacyId));
}

/**
 * Unified owner-settings rows: full catalog (toggle-only) plus custom channels.
 */
export function listUnifiedIncomeSourceRows(config: StoreChannelConfig) {
  const rows: Array<{
    rowId: string;
    toggleId: string;
    channel: Record<string, unknown>;
    isCatalog: boolean;
    isActive: boolean;
  }> = [];

  for (const entry of INCOME_SOURCE_CATALOG) {
    const channel = findConfiguredChannelByLegacyId(config, entry.legacyId);
    if (channel?.retired) continue;

    rows.push({
      rowId: String(channel?.id || entry.legacyId),
      toggleId: String(channel?.id || entry.legacyId),
      channel: channel || {
        id: entry.legacyId,
        legacyId: entry.legacyId,
        kind: entry.kind,
        nameAr: entry.nameAr,
        nameEn: entry.nameEn,
      },
      isCatalog: true,
      isActive: channel ? config.activeIds.includes(String(channel.id)) : false,
    });
  }

  for (const channel of config.channels) {
    if (channel.retired || isCatalogConfiguredChannel(channel)) continue;
    rows.push({
      rowId: String(channel.id),
      toggleId: String(channel.id),
      channel,
      isCatalog: false,
      isActive: config.activeIds.includes(String(channel.id)),
    });
  }

  return rows;
}

export function toggleIncomeSourceActive(config: StoreChannelConfig, channelOrLegacyId: string) {
  const configured = config.channels.find((channel) => channel.id === channelOrLegacyId)
    || findConfiguredChannelByLegacyId(config, channelOrLegacyId);

  if (configured) {
    return toggleSalesChannelActive(config, String(configured.id));
  }

  const catalogEntry = getCatalogEntry(channelOrLegacyId);
  if (!catalogEntry) {
    return { config, blocked: false, added: false };
  }

  return {
    ...addCatalogIncomeSource(config, catalogEntry.legacyId),
    blocked: false,
    added: true,
  };
}

export function listAddableCatalogSources(
  config: StoreChannelConfig,
  kind: "payment_method" | "sales_channel",
) {
  return listCatalogByKind(kind).filter((entry) => !channelExistsInConfig(config, entry.legacyId));
}

export function isLastActiveSalesChannel(config: StoreChannelConfig, channelId: string) {
  return config.activeIds.includes(channelId) && config.activeIds.length === 1;
}

export function toggleSalesChannelActive(config: StoreChannelConfig, channelId: string) {
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

export function canRequestRetireSalesChannel(
  config: StoreChannelConfig,
  channel: { id: string },
) {
  return !isLastActiveSalesChannel(config, channel.id);
}

export function restoreRetiredSalesChannel(
  config: StoreChannelConfig,
  channel: { id: string },
): StoreChannelConfig {
  return {
    channels: config.channels.map((item) => (
      item.id === channel.id ? { ...item, retired: false } : item
    )),
    activeIds: config.activeIds.includes(channel.id)
      ? config.activeIds
      : [...config.activeIds, channel.id],
  };
}

export function retireSalesChannelInDraft(
  config: StoreChannelConfig,
  channel: { id: string },
): StoreChannelConfig {
  return {
    activeIds: config.activeIds.filter((id) => id !== channel.id),
    channels: config.channels.map((item) => (
      item.id === channel.id ? { ...item, retired: true } : item
    )),
  };
}

export function addCatalogIncomeSource(
  config: StoreChannelConfig,
  legacyId: string,
  options: { icon?: unknown } = {},
) {
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
          nameAr: entry.nameAr,
          nameEn: entry.nameEn,
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

export function addCustomSalesChannel(
  config: StoreChannelConfig,
  name: string,
  options: { id?: string; icon?: unknown; kind?: "payment_method" | "sales_channel" } = {},
) {
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

export function listConfiguredChannelsByKind(
  config: StoreChannelConfig,
  kind: "payment_method" | "sales_channel",
) {
  return config.channels.filter((channel) => !channel.retired && resolveIncomeSourceKind(channel) === kind);
}

export function listVisibleChannelsByKind(
  config: StoreChannelConfig,
  visibleChannels: Array<Record<string, unknown>>,
  kind: "payment_method" | "sales_channel",
) {
  return visibleChannels.filter((channel) => resolveIncomeSourceKind(channel) === kind);
}

export function resolveChannelPersistName(
  channel: Record<string, unknown>,
  lang: "ar" | "en" = "ar",
) {
  const directName = String(channel?.nameAr || channel?.nameEn || "").trim();
  if (directName) return directName;

  const legacyId = String(
    channel?.legacyId
    || channel?.text
    || (typeof channel?.id === "string" ? channel.id : ""),
  ).trim();
  const catalogEntry = legacyId ? getCatalogEntry(legacyId) : undefined;
  if (catalogEntry) {
    return catalogDisplayName(catalogEntry.legacyId, lang);
  }

  return "";
}

export function resolveChannelPersistKind(channel: Record<string, unknown>) {
  return resolveIncomeSourceKind(channel);
}
