import { z } from "zod";

export type IncomeSourceKind = "payment_method" | "sales_channel";

export type CatalogIncomeSource = {
  legacyId: string;
  kind: IncomeSourceKind;
  nameAr: string;
  nameEn: string;
  uuid: string;
  defaultActive?: boolean;
};

export const INCOME_SOURCE_CATALOG: CatalogIncomeSource[] = [
  {
    legacyId: "cash",
    kind: "payment_method",
    nameAr: "نقد",
    nameEn: "Cash",
    uuid: "9bc40d4f-c773-4ba3-87db-b8bb1467dafb",
    defaultActive: true,
  },
  {
    legacyId: "card",
    kind: "payment_method",
    nameAr: "بطاقة",
    nameEn: "Card",
    uuid: "bb16ea8f-8abf-4ca9-ab0d-e3a8f69f8db1",
    defaultActive: true,
  },
  {
    legacyId: "mada",
    kind: "payment_method",
    nameAr: "مدى",
    nameEn: "Mada",
    uuid: "7c3a1f2e-8b4d-4e9a-a1c2-3d4e5f6a7b8c",
  },
  {
    legacyId: "bank",
    kind: "payment_method",
    nameAr: "بنك",
    nameEn: "Bank transfer",
    uuid: "b1a2c3d4-e5f6-4789-a012-3456789abcde",
  },
  {
    legacyId: "apple",
    kind: "payment_method",
    nameAr: "Apple Pay",
    nameEn: "Apple Pay",
    uuid: "8d4b2f3a-9c5e-4f0b-b2d3-4e5f6a7b8c9d",
  },
  {
    legacyId: "online",
    kind: "payment_method",
    nameAr: "أونلاين",
    nameEn: "Online",
    uuid: "f0f8dd28-4fbe-4bf2-9074-2be703f10ccd",
  },
  {
    legacyId: "jahez",
    kind: "sales_channel",
    nameAr: "جاهز",
    nameEn: "Jahez",
    uuid: "9e5c3a4b-0d6f-4a1c-a3e4-5f6a7b8c9d0e",
  },
  {
    legacyId: "hunger",
    kind: "sales_channel",
    nameAr: "هنقرستيشن",
    nameEn: "HungerStation",
    uuid: "af6d4b5c-1e7a-4b2d-a4f5-6a7b8c9d0e1f",
  },
  {
    legacyId: "keeta",
    kind: "sales_channel",
    nameAr: "كيتا",
    nameEn: "Keeta",
    uuid: "c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f",
  },
];

export const DEFAULT_NEW_STORE_INCOME_SOURCE_IDS = ["cash", "card"] as const;

/** @deprecated Use DEFAULT_NEW_STORE_INCOME_SOURCE_IDS */
export const DEFAULT_NEW_STORE_SALES_CHANNEL_IDS = DEFAULT_NEW_STORE_INCOME_SOURCE_IDS;

export const DEFAULT_SALES_CHANNEL_UUIDS: Record<string, string> = Object.fromEntries(
  INCOME_SOURCE_CATALOG.map((entry) => [entry.legacyId, entry.uuid]),
);

export const PAYMENT_METHOD_CATALOG_IDS = INCOME_SOURCE_CATALOG
  .filter((entry) => entry.kind === "payment_method")
  .map((entry) => entry.legacyId);

export const SALES_CHANNEL_CATALOG_IDS = INCOME_SOURCE_CATALOG
  .filter((entry) => entry.kind === "sales_channel")
  .map((entry) => entry.legacyId);

export function isUuid(value: string): boolean {
  return z.string().uuid().safeParse(value).success;
}

export function getCatalogEntry(legacyId: string): CatalogIncomeSource | undefined {
  const normalized = legacyId.trim();
  if (!normalized) return undefined;
  return INCOME_SOURCE_CATALOG.find((entry) => entry.legacyId === normalized);
}

export function listCatalogByKind(kind: IncomeSourceKind): CatalogIncomeSource[] {
  return INCOME_SOURCE_CATALOG.filter((entry) => entry.kind === kind);
}

export function buildCatalogUuidMap(): Record<string, string> {
  return { ...DEFAULT_SALES_CHANNEL_UUIDS };
}

type RuntimeChannel = {
  id?: string;
  legacyId?: string;
  text?: string;
  kind?: IncomeSourceKind;
  custom?: boolean;
};

function resolveChannelLegacyId(channel: RuntimeChannel): string {
  if (typeof channel.legacyId === "string" && channel.legacyId.trim() && !isUuid(channel.legacyId)) {
    return channel.legacyId.trim();
  }
  if (typeof channel.text === "string" && channel.text.trim() && !isUuid(channel.text)) {
    return channel.text.trim();
  }
  if (typeof channel.id === "string" && channel.id.trim() && !isUuid(channel.id)) {
    return channel.id.trim();
  }
  return "";
}

export function resolveIncomeSourceKind(channel: RuntimeChannel): IncomeSourceKind {
  if (channel.kind === "payment_method" || channel.kind === "sales_channel") {
    return channel.kind;
  }
  const legacyId = resolveChannelLegacyId(channel);
  const catalogEntry = legacyId ? getCatalogEntry(legacyId) : undefined;
  if (catalogEntry) return catalogEntry.kind;
  return "payment_method";
}

export function catalogDisplayName(
  legacyId: string,
  lang: "ar" | "en" = "ar",
): string {
  const entry = getCatalogEntry(legacyId);
  if (!entry) return legacyId;
  return lang === "ar" ? entry.nameAr : entry.nameEn;
}
