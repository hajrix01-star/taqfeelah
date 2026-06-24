import { z } from "zod";
import rawIncomeSourceCatalog from "./income-source-catalog-data.json";

export type IncomeSourceKind = "payment_method" | "sales_channel";

export type CatalogIncomeSource = {
  legacyId: string;
  kind: IncomeSourceKind;
  nameAr: string;
  nameEn: string;
  uuid: string;
  defaultActive?: boolean;
};

export const INCOME_SOURCE_CATALOG: CatalogIncomeSource[] = rawIncomeSourceCatalog as CatalogIncomeSource[];

export const DEFAULT_NEW_STORE_INCOME_SOURCE_IDS = INCOME_SOURCE_CATALOG
  .filter((entry) => entry.defaultActive)
  .map((entry) => entry.legacyId);

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
