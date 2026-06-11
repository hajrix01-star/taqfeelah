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
  let latest = null;
  for (const entry of entries) {
    const candidates = [
      resolveCloseoutOwnerEditMeta(entry),
      resolveCloseoutOwnerEditMeta({
        ownerEditedAt: entry.closeoutOwnerEditedAt,
        ownerEditedByUserId: entry.closeoutOwnerEditedByUserId,
        ownerEditedByName: entry.closeoutOwnerEditedByName,
      }),
    ].filter(Boolean);
    for (const meta of candidates) {
      if (!latest || String(meta.ownerEditedAt) > String(latest.ownerEditedAt)) {
        latest = meta;
      }
    }
  }
  return latest;
}

/**
 * Prefer the freshest owner-edit metadata between a frozen entry and closeouts list.
 *
 * @param {object | null | undefined} selected
 * @param {Array<object>} closeouts
 * @param {(entry: object, closeouts: Array<object>) => object | null | undefined} resolveCloseoutForEntry
 */
export function resolveSelectedCloseoutOwnerEditSource(selected, closeouts, resolveCloseoutForEntry) {
  if (!selected) return null;
  const entryMeta = resolveCloseoutOwnerEditMeta({
    ownerEditedAt: selected.closeoutOwnerEditedAt,
    ownerEditedByUserId: selected.closeoutOwnerEditedByUserId,
    ownerEditedByName: selected.closeoutOwnerEditedByName,
  }) || resolveCloseoutOwnerEditMeta(selected);
  const closeoutMeta = resolveCloseoutOwnerEditMeta(resolveCloseoutForEntry(selected, closeouts));
  if (!entryMeta) return closeoutMeta;
  if (!closeoutMeta) return entryMeta;
  return String(closeoutMeta.ownerEditedAt) >= String(entryMeta.ownerEditedAt)
    ? closeoutMeta
    : entryMeta;
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
