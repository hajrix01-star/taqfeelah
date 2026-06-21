import type { ResolveCloseoutStoreNameParams } from "./employee-closeouts-types";

function normalizedText(value: unknown): string {
  const text = String(value || "").trim();
  return text || "";
}

function firstFilled(...values: unknown[]): string {
  for (const value of values) {
    const normalized = normalizedText(value);
    if (normalized) return normalized;
  }
  return "";
}

const STORE_NAME_KEY_COPY: Record<string, Record<"ar" | "en", string>> = {
  restaurant: {
    ar: "مشويات المعلم الشامي",
    en: "Al Moallem Al Shami Grill",
  },
};

function localizedStoreNameFromKey(
  source: { nameKey?: string } | null | undefined,
  lang: string,
): string {
  const nameKey = normalizedText(source?.nameKey);
  if (!nameKey) return "";
  const locale = lang === "ar" ? "ar" : "en";
  return firstFilled(STORE_NAME_KEY_COPY[nameKey]?.[locale], nameKey);
}

export function resolveEmployeeStoreName(source: unknown, lang = "ar"): string {
  if (!source) return "";
  if (typeof source === "string") return normalizedText(source);
  if (typeof source !== "object") return "";

  const record = source as Record<string, unknown>;
  const localized = lang === "ar"
    ? firstFilled(record.nameAr, record.name, record.nameEn)
    : firstFilled(record.nameEn, record.name, record.nameAr);

  return firstFilled(
    record.displayName,
    record.storeName,
    localized,
    localizedStoreNameFromKey(record as { nameKey?: string }, lang),
    record.title,
    record.label,
    record.id,
  );
}

export function resolveCloseoutStoreName(params: ResolveCloseoutStoreNameParams = {}): string {
  const {
    preferredStoreName = "",
    closeout,
    currentStore,
    lang = "ar",
  } = params;
  const closeoutRecord = closeout as Record<string, unknown> | null | undefined;
  return firstFilled(
    resolveEmployeeStoreName(preferredStoreName, lang),
    resolveEmployeeStoreName(closeoutRecord?.storeName, lang),
    resolveEmployeeStoreName(closeoutRecord?.store, lang),
    resolveEmployeeStoreName(currentStore, lang),
  );
}
