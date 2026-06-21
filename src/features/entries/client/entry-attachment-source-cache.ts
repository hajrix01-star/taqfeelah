const resolvedSourceCache = new Map<string, string>();

function buildResolvedSourceCacheKey(storeId: string, attachmentId: string): string {
  return `${storeId || ""}|${attachmentId || ""}`;
}

export function readResolvedAttachmentSourceCache(storeId: string, attachmentId: string): string {
  const key = buildResolvedSourceCacheKey(storeId, attachmentId);
  return key === "|" ? "" : (resolvedSourceCache.get(key) || "");
}

export function writeResolvedAttachmentSourceCache(
  storeId: string,
  attachmentId: string,
  source: string,
): void {
  if (!attachmentId || !source) return;
  resolvedSourceCache.set(buildResolvedSourceCacheKey(storeId, attachmentId), source);
}

export function clearEntryAttachmentSourceCache(): void {
  resolvedSourceCache.clear();
}
