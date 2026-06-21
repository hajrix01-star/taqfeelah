export type CloseoutOwnerEditMeta = {
  ownerEditedAt: string;
  ownerEditedByUserId: string | null;
  ownerEditedByName: string;
};

type CloseoutOwnerEditSource = {
  ownerEditedAt?: unknown;
  ownerEditedByUserId?: unknown;
  ownerEditedByName?: unknown;
  closeoutOwnerEditedAt?: unknown;
  closeoutOwnerEditedByUserId?: unknown;
  closeoutOwnerEditedByName?: unknown;
};

export function resolveCloseoutOwnerEditMeta(source: CloseoutOwnerEditSource | null | undefined): CloseoutOwnerEditMeta | null {
  if (!source || typeof source !== "object") return null;
  const ownerEditedAt = typeof source.ownerEditedAt === "string" ? source.ownerEditedAt : null;
  if (!ownerEditedAt) return null;
  return {
    ownerEditedAt,
    ownerEditedByUserId: typeof source.ownerEditedByUserId === "string" ? source.ownerEditedByUserId : null,
    ownerEditedByName: typeof source.ownerEditedByName === "string" ? source.ownerEditedByName : "",
  };
}

export function resolveCloseoutOwnerEditMetaFromEntries(entries: CloseoutOwnerEditSource[] = []): CloseoutOwnerEditMeta | null {
  let latest: CloseoutOwnerEditMeta | null = null;
  for (const entry of entries) {
    const candidates = [
      resolveCloseoutOwnerEditMeta(entry),
      resolveCloseoutOwnerEditMeta({
        ownerEditedAt: entry.closeoutOwnerEditedAt,
        ownerEditedByUserId: entry.closeoutOwnerEditedByUserId,
        ownerEditedByName: entry.closeoutOwnerEditedByName,
      }),
    ].filter(Boolean) as CloseoutOwnerEditMeta[];
    for (const meta of candidates) {
      if (!latest || String(meta.ownerEditedAt) > String(latest.ownerEditedAt)) {
        latest = meta;
      }
    }
  }
  return latest;
}

export function resolveSelectedCloseoutOwnerEditSource<T extends CloseoutOwnerEditSource>(
  selected: T | null | undefined,
  closeouts: CloseoutOwnerEditSource[],
  resolveCloseoutForEntry: (entry: T, closeouts: CloseoutOwnerEditSource[]) => CloseoutOwnerEditSource | null | undefined,
): CloseoutOwnerEditMeta | null {
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

export function closeoutOwnerEditLabel(
  source: CloseoutOwnerEditSource | null | undefined,
  lang: "ar" | "en" = "ar",
): string {
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
