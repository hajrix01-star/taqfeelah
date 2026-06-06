export type AttachmentReviewEntryLike = {
  attachment?: unknown;
  reviewed?: boolean;
  status?: string;
  businessId?: string;
};

export function entryHasAttachmentLike(entry: AttachmentReviewEntryLike | null | undefined): boolean {
  return Boolean(entry?.attachment);
}

export function entryIsActiveLike(entry: AttachmentReviewEntryLike | null | undefined): boolean {
  return entry?.status !== "voided";
}

export function resolvePendingReviewCountForDisplay(
  pendingReviewCount: number,
  reviewEnabled: boolean,
): number {
  return reviewEnabled ? Math.max(0, Number(pendingReviewCount) || 0) : 0;
}

export function countProofsFromUiEntries(entries: AttachmentReviewEntryLike[]): number {
  return entries.filter(
    (entry) => entryIsActiveLike(entry) && entryHasAttachmentLike(entry),
  ).length;
}

export function countPendingReviewsFromUiEntries(
  entries: AttachmentReviewEntryLike[],
  reviewEnabledForBusiness: (businessId?: string) => boolean = () => false,
): number {
  return entries.filter(
    (entry) => entryIsActiveLike(entry)
      && entryHasAttachmentLike(entry)
      && !entry.reviewed
      && reviewEnabledForBusiness(entry.businessId),
  ).length;
}

export function applyReviewEnabledToAttachmentStats(
  stats: { attachmentCount?: number | null; pendingReviewCount?: number | null },
  reviewEnabled: boolean,
): { attachmentCount: number; pendingReviewCount: number } {
  return {
    attachmentCount: Math.max(0, Number(stats.attachmentCount) || 0),
    pendingReviewCount: resolvePendingReviewCountForDisplay(
      Number(stats.pendingReviewCount) || 0,
      reviewEnabled,
    ),
  };
}
