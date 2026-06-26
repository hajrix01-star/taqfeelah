export {
  DEFAULT_NEW_STORE_INCOME_SOURCE_IDS,
  DEFAULT_SALES_CHANNEL_UUIDS,
  buildCatalogUuidMap,
  getCatalogEntry,
  isUuid,
} from "./income-source-catalog";

import {
  DEFAULT_SALES_CHANNEL_UUIDS,
  INCOME_SOURCE_CATALOG,
  isUuid,
} from "./income-source-catalog";

const CHANNEL_LABELS: Record<string, string> = Object.fromEntries(
  INCOME_SOURCE_CATALOG.map((entry) => [entry.legacyId, entry.nameEn]),
);

const CHANNEL_ARABIC_LABELS: Record<string, string> = Object.fromEntries(
  INCOME_SOURCE_CATALOG.map((entry) => [entry.legacyId, entry.nameAr]),
);

export function salesChannelDisplayName(channel: {
  id?: string;
  legacyId?: string;
  custom?: boolean;
  nameEn?: string;
  nameAr?: string;
  text?: string;
}): string {
  if (channel.custom) {
    const nameEn = typeof channel.nameEn === "string" ? channel.nameEn.trim() : "";
    const nameAr = typeof channel.nameAr === "string" ? channel.nameAr.trim() : "";
    return nameEn || nameAr || String(channel.id || "Channel");
  }
  const legacyId = typeof channel.legacyId === "string" && channel.legacyId.trim()
    ? channel.legacyId.trim()
    : typeof channel.text === "string" && channel.text.trim()
      ? channel.text.trim()
      : typeof channel.id === "string"
        ? channel.id.trim()
        : "";
  return CHANNEL_LABELS[legacyId] || legacyId || "Channel";
}

export function defaultSalesChannelDbName(channel: {
  id?: string;
  legacyId?: string;
  custom?: boolean;
  nameEn?: string;
  nameAr?: string;
  text?: string;
}): string {
  if (channel.custom) {
    const nameAr = typeof channel.nameAr === "string" ? channel.nameAr.trim() : "";
    const nameEn = typeof channel.nameEn === "string" ? channel.nameEn.trim() : "";
    return nameAr || nameEn || String(channel.id || "Channel");
  }
  const legacyId = typeof channel.legacyId === "string" && channel.legacyId.trim()
    ? channel.legacyId.trim()
    : typeof channel.text === "string" && channel.text.trim()
      ? channel.text.trim()
      : typeof channel.id === "string"
        ? channel.id.trim()
        : "";
  return CHANNEL_ARABIC_LABELS[legacyId] || CHANNEL_LABELS[legacyId] || legacyId || "Channel";
}

export function resolveLegacySalesChannelUuid(
  legacyId: string,
  envMap: Record<string, string> = {},
): string {
  const normalized = legacyId.trim();
  if (!normalized) return "";
  if (isUuid(normalized)) return normalized;
  const fromEnv = envMap[normalized];
  if (isUuid(fromEnv)) return fromEnv;
  const fromDefaults = DEFAULT_SALES_CHANNEL_UUIDS[normalized];
  return isUuid(fromDefaults) ? fromDefaults : "";
}

type RuntimeChannel = {
  id?: string;
  legacyId?: string;
  apiChannelId?: string;
  custom?: boolean;
  nameEn?: string;
  nameAr?: string;
  text?: string;
};

type StoreChannelSettings = Record<string, {
  channels?: RuntimeChannel[];
  activeIds?: string[];
} | undefined>;

/** Merge env, catalog defaults, and runtime channel apiChannelId values. */
export function buildSalesChannelIdMap({
  envSalesChannelIdMap = {},
  storeChannelSettings = {},
  includeCatalogDefaults = true,
}: {
  envSalesChannelIdMap?: Record<string, string>;
  storeChannelSettings?: StoreChannelSettings;
  /** When false (production DB source), only DB-backed apiChannelId/env maps are trusted. */
  includeCatalogDefaults?: boolean;
} = {}): Record<string, string> {
  const map: Record<string, string> = {};

  if (includeCatalogDefaults) {
    for (const [legacyId, uuid] of Object.entries(DEFAULT_SALES_CHANNEL_UUIDS)) {
      if (isUuid(uuid)) map[legacyId] = uuid;
    }
  }
  for (const [legacyId, uuid] of Object.entries(envSalesChannelIdMap)) {
    if (isUuid(uuid)) map[legacyId] = uuid;
  }

  for (const config of Object.values(storeChannelSettings)) {
    if (!config || typeof config !== "object") continue;
    for (const channel of config.channels || []) {
      const legacyId = typeof channel?.legacyId === "string" && channel.legacyId.trim()
        ? channel.legacyId.trim()
        : typeof channel?.id === "string" && !isUuid(channel.id)
          ? channel.id.trim()
          : "";
      const apiChannelId = (typeof channel?.apiChannelId === "string" ? channel.apiChannelId.trim() : "")
        || (typeof channel?.id === "string" && isUuid(channel.id) ? channel.id.trim() : "");
      if (legacyId && isUuid(apiChannelId)) {
        map[legacyId] = apiChannelId;
      }
      if (isUuid(apiChannelId)) {
        map[apiChannelId] = apiChannelId;
      }
    }
  }

  return map;
}
