export type AttachmentEntryLike = {
  attachment?: unknown;
  status?: string;
};

export function entryHasAttachmentLike(entry: AttachmentEntryLike | null | undefined): boolean {
  return Boolean(entry?.attachment);
}

export function entryIsActiveLike(entry: AttachmentEntryLike | null | undefined): boolean {
  return entry?.status !== "voided";
}

export function countProofsFromUiEntries(entries: AttachmentEntryLike[]): number {
  return entries.filter(
    (entry) => entryIsActiveLike(entry) && entryHasAttachmentLike(entry),
  ).length;
}

export function normalizeAttachmentCount(
  stats: { attachmentCount?: number | null },
): { attachmentCount: number } {
  return {
    attachmentCount: Math.max(0, Number(stats.attachmentCount) || 0),
  };
}
