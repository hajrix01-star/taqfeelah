import type { StoreChannelConfig } from "./org-config-client-types";

export const EMPTY_STORE_CHANNEL_CONFIG: StoreChannelConfig = Object.freeze({
  channels: [],
  activeIds: [],
});

function normalizeStoreChannelConfig(
  config: StoreChannelConfig | null | undefined,
  fallback: StoreChannelConfig = EMPTY_STORE_CHANNEL_CONFIG,
): StoreChannelConfig {
  if (!config || !Array.isArray(config.channels) || !Array.isArray(config.activeIds)) {
    return fallback;
  }
  return config;
}

export function getStoreChannelConfig(
  settings: Record<string, StoreChannelConfig | undefined> | null | undefined,
  storeId: string | null | undefined,
  defaultConfig: StoreChannelConfig = EMPTY_STORE_CHANNEL_CONFIG,
): StoreChannelConfig {
  if (!storeId) return normalizeStoreChannelConfig(defaultConfig);
  return normalizeStoreChannelConfig(settings?.[storeId], normalizeStoreChannelConfig(defaultConfig));
}

export function createDefaultStoreChannelConfig(
  defaultChannels: Array<{ id: string } & Record<string, unknown>>,
): StoreChannelConfig {
  return {
    channels: defaultChannels.map((channel) => ({ ...channel })),
    activeIds: defaultChannels.map((channel) => channel.id),
  };
}

export function resolveStoreChannelConfig(
  settings: Record<string, StoreChannelConfig | undefined> | null | undefined,
  storeId: string | null | undefined,
  defaultConfig: StoreChannelConfig,
) {
  return getStoreChannelConfig(settings, storeId, defaultConfig);
}

export function ensureStoreChannelSettingsForBusinesses(
  current: Record<string, StoreChannelConfig>,
  businessIds: string[],
  defaultConfig: StoreChannelConfig,
  { allowLocalDefaults = true }: { allowLocalDefaults?: boolean } = {},
) {
  let changed = false;
  const next = { ...current };

  businessIds.forEach((businessId) => {
    if (!next[businessId]) {
      next[businessId] = allowLocalDefaults
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

export function buildInitialStoreChannelSettings(
  savedSettings: Record<string, unknown> | null | undefined,
  storeList: Array<{ id: string } & Record<string, unknown>>,
  defaultConfig: StoreChannelConfig,
) {
  if (savedSettings?.storeChannelSettings) {
    return savedSettings.storeChannelSettings as Record<string, StoreChannelConfig>;
  }

  const legacyChannels = (savedSettings?.configuredChannels as Array<Record<string, unknown>> | undefined)
    || defaultConfig.channels;
  const legacyActiveIds = (savedSettings?.activeChannels as string[] | undefined)
    || legacyChannels.filter((channel) => !channel.retired).map((channel) => String(channel.id || ""));

  return Object.fromEntries(
    (storeList || []).map((business) => [
      business.id,
      {
        channels: legacyChannels.map((channel) => ({ ...channel })),
        activeIds: [...legacyActiveIds],
      },
    ]),
  ) as Record<string, StoreChannelConfig>;
}
