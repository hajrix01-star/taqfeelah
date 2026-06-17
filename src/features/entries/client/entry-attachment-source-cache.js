const resolvedSourceCache = new Map();

function buildResolvedSourceCacheKey(storeId, attachmentId) {
  return `${storeId || ""}|${attachmentId || ""}`;
}

export function readResolvedAttachmentSourceCache(storeId, attachmentId) {
  const key = buildResolvedSourceCacheKey(storeId, attachmentId);
  return key === "|" ? "" : (resolvedSourceCache.get(key) || "");
}

export function writeResolvedAttachmentSourceCache(storeId, attachmentId, source) {
  if (!attachmentId || !source) return;
  resolvedSourceCache.set(buildResolvedSourceCacheKey(storeId, attachmentId), source);
}

export function clearEntryAttachmentSourceCache() {
  resolvedSourceCache.clear();
}
