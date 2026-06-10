/**
 * @param {Array<Record<string, unknown>>} entries
 * @param {Record<string, unknown>} payload
 * @param {(entry: Record<string, unknown>) => boolean} isActive
 */
export function findDuplicateSummaryEntries(entries, payload, isActive) {
  return entries.filter((entry) => (
    entry.type === "summary"
    && isActive(entry)
    && entry.businessId === payload.businessId
    && entry.date === payload.date
  ));
}

/**
 * @param {Array<Record<string, unknown>>} entries
 * @param {string} businessId
 * @param {string} fallbackDate
 * @param {(entry: Record<string, unknown>) => boolean} isActive
 */
export function resolveLatestActiveCloseoutDateFromEntries(
  entries,
  businessId,
  fallbackDate,
  isActive,
) {
  const latest = entries
    .filter((entry) => entry.businessId === businessId && entry.type === "summary" && isActive(entry))
    .map((entry) => String(entry.date))
    .sort()
    .pop();
  return latest || fallbackDate;
}

/**
 * @param {Record<string, string>} current
 * @param {string} businessId
 * @param {string} entryDate
 */
export function mergeLastCloseoutDateForStore(current, businessId, entryDate) {
  const previous = current[businessId];
  return {
    ...current,
    [businessId]: !previous || entryDate > previous ? entryDate : previous,
  };
}

/**
 * @param {Record<string, unknown>} payload
 * @param {Record<string, unknown>} entry
 * @param {Record<string, unknown>} actor
 * @param {number} [now]
 */
export function buildCloseoutAlertRecord(payload, entry, actor, now = Date.now()) {
  return {
    id: `co-${entry.id}`,
    businessId: payload.businessId,
    date: payload.date,
    entryId: entry.id,
    employeeNameAr: actor.nameAr,
    employeeNameEn: actor.nameEn,
    seen: false,
    at: now,
  };
}

/**
 * @param {Array<Record<string, unknown>>} alerts
 * @param {Record<string, unknown>} record
 */
export function upsertCloseoutAlert(alerts, record) {
  return [record, ...alerts.filter((item) => item.id !== record.id)];
}

/**
 * @param {Object} input
 * @param {string | undefined | null} input.lastCloseoutDate
 * @param {string} input.todayDate
 * @param {(date: string) => string} input.nextDay
 */
export function resolveSuggestedEntryDate({ lastCloseoutDate, todayDate, nextDay }) {
  const calculated = lastCloseoutDate ? nextDay(lastCloseoutDate) : todayDate;
  return calculated > todayDate ? todayDate : calculated;
}

/**
 * @param {string} entryDate
 * @param {string} todayDate
 */
export function isFutureOperationalEntryDate(entryDate, todayDate) {
  return entryDate > todayDate;
}

/**
 * @param {"ar" | "en"} [lang]
 */
export function resolveOperationalEntrySaveFailureMessage(lang = "ar") {
  return lang === "ar" ? "تعذر حفظ العملية على الخادم." : "Failed to save entry on server.";
}

/**
 * Shown when a write succeeded but post-save register refresh failed.
 * @param {"ar" | "en"} [lang]
 */
export function resolveOperationalEntriesRefreshWarningMessage(lang = "ar") {
  return lang === "ar"
    ? "تم الحفظ، لكن تعذر تحديث السجل من الخادم. أعد فتح الصفحة أو حدّث البيانات."
    : "Saved, but the register could not be refreshed from the server. Reopen the page or refresh data.";
}
