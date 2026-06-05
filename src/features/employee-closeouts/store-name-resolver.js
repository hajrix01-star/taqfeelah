function normalizedText(value) {
  const text = String(value || "").trim();
  return text || "";
}

function firstFilled(...values) {
  for (const value of values) {
    const normalized = normalizedText(value);
    if (normalized) return normalized;
  }
  return "";
}

const STORE_NAME_KEY_COPY = {
  restaurant: {
    ar: "مشويات المعلم الشامي",
    en: "Al Moallem Al Shami Grill",
  },
};

function localizedStoreNameFromKey(source, lang) {
  const nameKey = normalizedText(source?.nameKey);
  if (!nameKey) return "";
  const locale = lang === "ar" ? "ar" : "en";
  return firstFilled(STORE_NAME_KEY_COPY[nameKey]?.[locale], nameKey);
}

export function resolveEmployeeStoreName(source, lang = "ar") {
  if (!source) return "";
  if (typeof source === "string") return normalizedText(source);
  if (typeof source !== "object") return "";

  const localized = lang === "ar"
    ? firstFilled(source.nameAr, source.name, source.nameEn)
    : firstFilled(source.nameEn, source.name, source.nameAr);

  return firstFilled(
    source.displayName,
    source.storeName,
    localized,
    localizedStoreNameFromKey(source, lang),
    source.title,
    source.label,
    source.id,
  );
}

/**
 * @param {{
 * preferredStoreName?: string,
 * closeout?: unknown,
 * currentStore?: unknown,
 * lang?: "ar" | "en" | string,
 * }} params
 */
export function resolveCloseoutStoreName(params = {}) {
  const {
    preferredStoreName = "",
    closeout,
    currentStore,
    lang = "ar",
  } = params;
  return firstFilled(
    resolveEmployeeStoreName(preferredStoreName, lang),
    resolveEmployeeStoreName(closeout?.storeName, lang),
    resolveEmployeeStoreName(closeout?.store, lang),
    resolveEmployeeStoreName(currentStore, lang),
  );
}
