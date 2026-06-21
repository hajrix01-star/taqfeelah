import type { DisplayLang } from "@/core/i18n/display-locale";
import type { OperationalEntry, OperationalEntryActor } from "@/features/entries/client/entries-client-types";

export function canVoidOperationalEntry(
  target: OperationalEntry | null | undefined,
  archivedBusinessIds: string[],
  isVoided: (entry: OperationalEntry) => boolean,
): boolean {
  if (!target) return false;
  return !isVoided(target)
    && !archivedBusinessIds.includes(String(target.businessId));
}

export function canRestoreOperationalEntry(
  target: OperationalEntry | null | undefined,
  archivedBusinessIds: string[],
  isVoided: (entry: OperationalEntry) => boolean,
): boolean {
  if (!target) return false;
  return isVoided(target)
    && !archivedBusinessIds.includes(String(target.businessId));
}

export function applyVoidToEntry(
  entry: OperationalEntry,
  actor: OperationalEntryActor,
  reason = "",
  actionAt = new Date().toISOString(),
): OperationalEntry {
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

export function applyRestoreToEntry(
  entry: OperationalEntry,
  actor: OperationalEntryActor,
  reason = "",
  actionAt = new Date().toISOString(),
): OperationalEntry {
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

export function applyReviewToEntry(
  entry: OperationalEntry,
  actor: OperationalEntryActor,
  actionAt = new Date().toISOString(),
): OperationalEntry {
  return {
    ...entry,
    reviewed: true,
    reviewedAt: actionAt,
    reviewedBy: actor,
    auditTrail: [
      ...(entry.auditTrail || []),
      { action: "reviewed", at: actionAt, by: actor, reason: "" },
    ],
  } as OperationalEntry;
}

export function mapOperationalEntryMutation(
  entries: OperationalEntry[],
  entryId: string,
  mutate: (entry: OperationalEntry) => OperationalEntry,
): OperationalEntry[] {
  return entries.map((entry) => (entry.id === entryId ? mutate(entry) : entry));
}

export function applyDuplicateApprovedAudit(
  entries: OperationalEntry[],
  approvedIds: Set<string>,
  actor: OperationalEntryActor,
  actionAt = new Date().toISOString(),
): OperationalEntry[] {
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

export function mergeLastCloseoutDateAfterSummaryVoid(
  current: Record<string, string>,
  businessId: string,
  entries: OperationalEntry[],
  isActive: (entry: OperationalEntry) => boolean,
): Record<string, string> {
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

export function mergeLastCloseoutDateAfterSummaryRestore(
  current: Record<string, string>,
  businessId: string,
  entries: OperationalEntry[],
  fallbackDate: string,
  isActive: (entry: OperationalEntry) => boolean,
): Record<string, string> {
  const latest = entries
    .filter((entry) => entry.businessId === businessId && entry.type === "summary" && isActive(entry))
    .map((entry) => String(entry.date))
    .sort()
    .pop();
  return { ...current, [businessId]: latest || fallbackDate };
}

export function duplicateSalesGroupKey(group: { businessId?: string; date?: string }): string {
  return `${group.businessId}|${group.date}`;
}

export function duplicateSalesSignature(entries: Array<{ id?: string }> = []): string {
  return entries.map((entry) => String(entry.id)).sort().join("|");
}

export function resolveOperationalEntryReviewFailureMessage(lang: DisplayLang = "ar"): string {
  return lang === "ar" ? "تعذر تحديث المراجعة على الخادم." : "Failed to update review on server.";
}

export function resolveOperationalEntryVoidFailureMessage(lang: DisplayLang = "ar"): string {
  return lang === "ar" ? "تعذر إلغاء العملية على الخادم." : "Failed to void entry on server.";
}

export function resolveOperationalEntryRestoreFailureMessage(lang: DisplayLang = "ar"): string {
  return lang === "ar" ? "تعذر استرجاع العملية على الخادم." : "Failed to restore entry on server.";
}

export function resolveDuplicateSummaryApproveFailureMessage(lang: DisplayLang = "ar"): string {
  return lang === "ar" ? "تعذر حفظ الملخص المكرر على الخادم." : "Failed to save duplicate summary on server.";
}

export function resolveDuplicateSummaryAcknowledgeFailureMessage(lang: DisplayLang = "ar"): string {
  return lang === "ar" ? "تعذر تأكيد الملخصات المكررة على الخادم." : "Failed to acknowledge duplicate summaries on server.";
}
