export type AttachmentReviewEntryLike = {
  attachment?: unknown;
  status?: string;
};

export function entryHasAttachmentLike(entry: AttachmentReviewEntryLike | null | undefined): boolean {
  return Boolean(entry?.attachment);
}

export function entryIsActiveLike(entry: AttachmentReviewEntryLike | null | undefined): boolean {
  return entry?.status !== "voided";
}

export function countProofsFromUiEntries(entries: AttachmentReviewEntryLike[]): number {
  return entries.filter(
    (entry) => entryIsActiveLike(entry) && entryHasAttachmentLike(entry),
  ).length;
}

export function applyReviewEnabledToAttachmentStats(
  stats: { attachmentCount?: number | null; pendingReviewCount?: number | null },
): { attachmentCount: number; pendingReviewCount: number } {
  return {
    attachmentCount: Math.max(0, Number(stats.attachmentCount) || 0),
    pendingReviewCount: 0,
  };
}
