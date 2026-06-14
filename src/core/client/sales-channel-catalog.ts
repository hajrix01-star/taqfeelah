import { z } from "zod";

/** Stable DB UUIDs for prototype/UI legacy sales channel ids. */
export const DEFAULT_SALES_CHANNEL_UUIDS: Record<string, string> = {
  cash: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
  bank: "b1a2c3d4-e5f6-4789-a012-3456789abcde",
  card: "bb16ea8f-8abf-4ca9-ab0d-e3a8f69f8db1",
  online: "f0f8dd28-4fbe-4bf2-9074-2be703f10ccd",
  mada: "7c3a1f2e-8b4d-4e9a-a1c2-3d4e5f6a7b8c",
  apple: "8d4b2f3a-9c5e-4f0b-b2d3-4e5f6a7b8c9d",
  jahez: "9e5c3a4b-0d6f-4a1c-a3e4-5f6a7b8c9d0e",
  hunger: "af6d4b5c-1e7a-4b2d-a4f5-6a7b8c9d0e1f",
};

/** Default active sales channels for every newly provisioned store. */
export const DEFAULT_NEW_STORE_SALES_CHANNEL_IDS = ["cash", "bank"] as const;

/** @deprecated Use DEFAULT_NEW_STORE_SALES_CHANNEL_IDS */
export const PROTOTYPE_SALES_CHANNEL_IDS = DEFAULT_NEW_STORE_SALES_CHANNEL_IDS;

const CHANNEL_LABELS: Record<string, string> = {
  cash: "Cash",
  bank: "Bank",
  card: "Card",
  online: "Online",
  mada: "Mada",
  apple: "Apple Pay",
  jahez: "Jahez",
  hunger: "HungerStation",
};

const CHANNEL_ARABIC_LABELS: Record<string, string> = {
  cash: "نقد",
  bank: "بنك",
  card: "بطاقة",
  online: "أونلاين",
  mada: "مدى",
  apple: "Apple Pay",
  jahez: "جاهز",
  hunger: "هنقرستيشن",
};

export function isUuid(value: string): boolean {
  return z.string().uuid().safeParse(value).success;
}

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
