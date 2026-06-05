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
    source.title,
    source.label,
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
