import type { DisplayLang } from "@/core/i18n/display-locale";
import type {
  OperationalEntry,
  OperationalEntryActor,
  OperationalEntryPayload,
} from "@/features/entries/client/entries-client-types";
import type { CloseoutAlertRecord, ResolveSuggestedEntryDateInput } from "@/features/operations/operations-types";

export function findDuplicateSummaryEntries(
  entries: OperationalEntry[],
  payload: OperationalEntryPayload,
  isActive: (entry: OperationalEntry) => boolean,
): OperationalEntry[] {
  return entries.filter((entry) => (
    entry.type === "summary"
    && isActive(entry)
    && entry.businessId === payload.businessId
    && entry.date === payload.date
  ));
}

export function resolveLatestActiveCloseoutDateFromEntries(
  entries: OperationalEntry[],
  businessId: string,
  fallbackDate: string,
  isActive: (entry: OperationalEntry) => boolean,
): string {
  const latest = entries
    .filter((entry) => entry.businessId === businessId && entry.type === "summary" && isActive(entry))
    .map((entry) => String(entry.date))
    .sort()
    .pop();
  return latest || fallbackDate;
}

export function mergeLastCloseoutDateForStore(
  current: Record<string, string>,
  businessId: string,
  entryDate: string,
): Record<string, string> {
  const previous = current[businessId];
  return {
    ...current,
    [businessId]: !previous || entryDate > previous ? entryDate : previous,
  };
}

export function buildCloseoutAlertRecord(
  payload: OperationalEntryPayload,
  entry: OperationalEntry,
  actor: OperationalEntryActor,
  now = Date.now(),
): CloseoutAlertRecord {
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

export function upsertCloseoutAlert(
  alerts: CloseoutAlertRecord[],
  record: CloseoutAlertRecord,
): CloseoutAlertRecord[] {
  return [record, ...alerts.filter((item) => item.id !== record.id)];
}

export function resolveSuggestedEntryDate({
  lastCloseoutDate,
  todayDate,
  nextDay,
}: ResolveSuggestedEntryDateInput): string {
  const calculated = lastCloseoutDate ? nextDay(lastCloseoutDate) : todayDate;
  return calculated > todayDate ? todayDate : calculated;
}

export function isFutureOperationalEntryDate(entryDate: string, todayDate: string): boolean {
  return entryDate > todayDate;
}

export function resolveOperationalEntrySaveFailureMessage(lang: DisplayLang = "ar"): string {
  return lang === "ar" ? "تعذر حفظ العملية على الخادم." : "Failed to save entry on server.";
}

export function resolveOperationalEntriesRefreshWarningMessage(lang: DisplayLang = "ar"): string {
  return lang === "ar"
    ? "تم الحفظ، لكن تعذر تحديث السجل من الخادم. أعد فتح الصفحة أو حدّث البيانات."
    : "Saved, but the register could not be refreshed from the server. Reopen the page or refresh data.";
}
