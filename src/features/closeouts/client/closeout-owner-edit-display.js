/**
 * @param {object | null | undefined} source
 */
export function resolveCloseoutOwnerEditMeta(source) {
  if (!source || typeof source !== "object") return null;
  const ownerEditedAt = typeof source.ownerEditedAt === "string" ? source.ownerEditedAt : null;
  if (!ownerEditedAt) return null;
  return {
    ownerEditedAt,
    ownerEditedByUserId: typeof source.ownerEditedByUserId === "string" ? source.ownerEditedByUserId : null,
    ownerEditedByName: typeof source.ownerEditedByName === "string" ? source.ownerEditedByName : "",
  };
}

/**
 * @param {Array<object>} entries
 */
export function resolveCloseoutOwnerEditMetaFromEntries(entries = []) {
  for (const entry of entries) {
    const meta = resolveCloseoutOwnerEditMeta(entry);
    if (meta) return meta;
    const nested = resolveCloseoutOwnerEditMeta({
      ownerEditedAt: entry.closeoutOwnerEditedAt,
      ownerEditedByUserId: entry.closeoutOwnerEditedByUserId,
      ownerEditedByName: entry.closeoutOwnerEditedByName,
    });
    if (nested) return nested;
  }
  return null;
}

/**
 * @param {object | null | undefined} source
 * @param {"ar" | "en"} [lang="ar"]
 */
export function closeoutOwnerEditLabel(source, lang = "ar") {
  const meta = resolveCloseoutOwnerEditMeta(source);
  if (!meta) return "";
  if (lang === "ar") {
    return meta.ownerEditedByName
      ? `تم التعديل من قبل المالك (${meta.ownerEditedByName})`
      : "تم التعديل من قبل المالك";
  }
  return meta.ownerEditedByName
    ? `Edited by owner (${meta.ownerEditedByName})`
    : "Edited by owner";
}
