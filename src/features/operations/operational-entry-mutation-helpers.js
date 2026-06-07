/**
 * @param {Record<string, unknown> | null | undefined} target
 * @param {string[]} archivedBusinessIds
 * @param {(entry: Record<string, unknown>) => boolean} isVoided
 */
export function canVoidOperationalEntry(target, archivedBusinessIds, isVoided) {
  return Boolean(target)
    && !isVoided(target)
    && !archivedBusinessIds.includes(String(target.businessId));
}

/**
 * @param {Record<string, unknown> | null | undefined} target
 * @param {string[]} archivedBusinessIds
 * @param {(entry: Record<string, unknown>) => boolean} isVoided
 */
export function canRestoreOperationalEntry(target, archivedBusinessIds, isVoided) {
  return Boolean(target)
    && isVoided(target)
    && !archivedBusinessIds.includes(String(target.businessId));
}

/**
 * @param {Record<string, unknown>} entry
 * @param {Record<string, unknown>} actor
 * @param {string} [reason]
 * @param {string} [actionAt]
 */
export function applyVoidToEntry(entry, actor, reason = "", actionAt = new Date().toISOString()) {
  const trimmedReason = String(reason).trim();
  return {
    ...entry,
    status: "voided",
    voidedAt: actionAt,
    voidedBy: actor,
    voidReason: trimmedReason,
    auditTrail: [
      ...(entry.auditTrail || []),
      { action: "voided", at: actionAt, by: actor, reason: trimmedReason },
    ],
  };
}

/**
 * @param {Record<string, unknown>} entry
 * @param {Record<string, unknown>} actor
 * @param {string} [reason]
 * @param {string} [actionAt]
 */
export function applyRestoreToEntry(entry, actor, reason = "", actionAt = new Date().toISOString()) {
  const trimmedReason = String(reason).trim();
  return {
    ...entry,
    status: "active",
    restoredAt: actionAt,
    restoredBy: actor,
    restoreReason: trimmedReason,
    auditTrail: [
      ...(entry.auditTrail || []),
      { action: "restored", at: actionAt, by: actor, reason: trimmedReason },
    ],
  };
}

/**
 * @param {Record<string, unknown>} entry
 * @param {Record<string, unknown>} actor
 * @param {string} [actionAt]
 */
export function applyReviewToEntry(entry, actor, actionAt = new Date().toISOString()) {
  return {
    ...entry,
    reviewed: true,
    reviewedAt: actionAt,
    reviewedBy: actor,
    auditTrail: [
      ...(entry.auditTrail || []),
      { action: "reviewed", at: actionAt, by: actor, reason: "" },
    ],
  };
}

/**
 * @param {Array<Record<string, unknown>>} entries
 * @param {string} entryId
 * @param {(entry: Record<string, unknown>) => Record<string, unknown>} mutate
 */
export function mapOperationalEntryMutation(entries, entryId, mutate) {
  return entries.map((entry) => (entry.id === entryId ? mutate(entry) : entry));
}

/**
 * @param {Array<Record<string, unknown>>} entries
 * @param {Set<string>} approvedIds
 * @param {Record<string, unknown>} actor
 * @param {string} [actionAt]
 */
export function applyDuplicateApprovedAudit(entries, approvedIds, actor, actionAt = new Date().toISOString()) {
  return entries.map((entry) => (
    approvedIds.has(String(entry.id))
      ? {
          ...entry,
          auditTrail: [
            ...(entry.auditTrail || []),
            { action: "duplicate_approved", at: actionAt, by: actor, reason: "" },
          ],
        }
      : entry
  ));
}

/**
 * @param {Array<Record<string, unknown>>} entries
 * @param {string} businessId
 * @param {(entry: Record<string, unknown>) => boolean} isActive
 */
export function mergeLastCloseoutDateAfterSummaryVoid(current, businessId, entries, isActive) {
  const latest = entries
    .filter((entry) => entry.businessId === businessId && entry.type === "summary" && isActive(entry))
    .map((entry) => String(entry.date))
    .sort()
    .pop();
  const next = { ...current };
  if (latest) next[businessId] = latest;
  else delete next[businessId];
  return next;
}

/**
 * @param {Record<string, string>} current
 * @param {string} businessId
 * @param {Array<Record<string, unknown>>} entries
 * @param {string} fallbackDate
 * @param {(entry: Record<string, unknown>) => boolean} isActive
 */
export function mergeLastCloseoutDateAfterSummaryRestore(
  current,
  businessId,
  entries,
  fallbackDate,
  isActive,
) {
  const latest = entries
    .filter((entry) => entry.businessId === businessId && entry.type === "summary" && isActive(entry))
    .map((entry) => String(entry.date))
    .sort()
    .pop();
  return { ...current, [businessId]: latest || fallbackDate };
}

/**
 * @param {Record<string, unknown>} group
 */
export function duplicateSalesGroupKey(group) {
  return `${group.businessId}|${group.date}`;
}

/**
 * @param {Array<{ id: string }>} [entries]
 */
export function duplicateSalesSignature(entries = []) {
  return entries.map((entry) => entry.id).sort().join("|");
}

/**
 * @param {"ar" | "en"} [lang]
 */
export function resolveOperationalEntryReviewFailureMessage(lang = "ar") {
  return lang === "ar" ? "تعذر تحديث المراجعة على الخادم." : "Failed to update review on server.";
}

/**
 * @param {"ar" | "en"} [lang]
 */
export function resolveOperationalEntryVoidFailureMessage(lang = "ar") {
  return lang === "ar" ? "تعذر إلغاء العملية على الخادم." : "Failed to void entry on server.";
}

/**
 * @param {"ar" | "en"} [lang]
 */
export function resolveOperationalEntryRestoreFailureMessage(lang = "ar") {
  return lang === "ar" ? "تعذر استرجاع العملية على الخادم." : "Failed to restore entry on server.";
}

/**
 * @param {"ar" | "en"} [lang]
 */
export function resolveDuplicateSummaryApproveFailureMessage(lang = "ar") {
  return lang === "ar" ? "تعذر حفظ الملخص المكرر على الخادم." : "Failed to save duplicate summary on server.";
}

/**
 * @param {"ar" | "en"} [lang]
 */
export function resolveDuplicateSummaryAcknowledgeFailureMessage(lang = "ar") {
  return lang === "ar" ? "تعذر تأكيد الملخصات المكررة على الخادم." : "Failed to acknowledge duplicate summaries on server.";
}
