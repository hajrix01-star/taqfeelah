import type { DisplayLang } from "@/core/i18n/display-locale";
import type {
  OperationalEntry,
  OperationalEntryActor,
  OperationalEntryPayload,
} from "@/features/entries/client/entries-client-types";
import type {
  CanPersistOperationalEntryInput,
  CloseoutAlertRecord,
  EmployeeEntryActorInput,
  PendingDuplicateSummaryState,
  PersistOperationalEntryLocallyInput,
  PersistOperationalEntryLocallyResult,
  PersistOperationalEntryThroughApiInput,
  PersistOperationalEntryThroughApiResult,
  ResolveSuggestedEntryDateInput,
  ResolveSummaryLastCloseoutUpdateResult,
} from "@/features/operations/operations-types";
import { refreshOperationalEntriesBestEffort } from "./client/refresh-operational-entries-best-effort";
import { resolveStandaloneEntryBlockedMessage } from "./client/closeout-required-entry-message";
import {
  resolveLatestActiveCloseoutDateFromEntries,
  resolveOperationalEntrySaveFailureMessage,
} from "./operational-entry-save-helpers";

export function canPersistOperationalEntry({
  saving,
  payload,
  allowedBusinessIds,
}: CanPersistOperationalEntryInput): boolean {
  return !saving
    && Boolean(payload?.businessId)
    && allowedBusinessIds.includes(String(payload!.businessId));
}

export function buildEmployeeEntryActor(employee: EmployeeEntryActorInput): OperationalEntryActor {
  return {
    role: "employee",
    userId: employee.id,
    nameAr: employee.nameAr,
    nameEn: employee.nameEn,
  };
}

export function shouldGateSummarySaveOnDuplicates(_payload?: OperationalEntryPayload): boolean {
  void _payload;
  return false;
}

export function buildPendingDuplicateSummaryState(
  payload: OperationalEntryPayload,
  previousEntries: OperationalEntry[],
  actor?: "owner" | "employee" | string,
): PendingDuplicateSummaryState {
  return actor ? { payload, previousEntries, actor } : { payload, previousEntries };
}

export function findCreatedEntryInRefreshedList(
  refreshed: OperationalEntry[],
  createdId: string | undefined,
): OperationalEntry | null {
  if (!createdId) return null;
  return refreshed.find((entry) => entry.id === createdId) || null;
}

export function resolveSummaryLastCloseoutUpdate(
  payload: OperationalEntryPayload,
  refreshed: OperationalEntry[],
  createdId: string,
  isActive: (entry: OperationalEntry) => boolean,
): ResolveSummaryLastCloseoutUpdateResult {
  const businessId = String(payload.businessId);
  const date = resolveLatestActiveCloseoutDateFromEntries(
    refreshed,
    businessId,
    String(payload.date),
    isActive,
  );
  return {
    businessId,
    date,
    createdEntry: findCreatedEntryInRefreshedList(refreshed, createdId),
  };
}

export async function persistOperationalEntryThroughApi({
  createOperationalEntryInApi,
  loadOperationalEntriesFromApi,
  payload,
  actorUserId,
  actorRole,
  lang = "ar",
  entriesApiDbSource = false,
}: PersistOperationalEntryThroughApiInput): Promise<PersistOperationalEntryThroughApiResult> {
  const blockedMessage = resolveStandaloneEntryBlockedMessage(entriesApiDbSource, lang);
  if (blockedMessage) {
    return { ok: false, failureMessage: blockedMessage };
  }
  let created: OperationalEntry | null;
  try {
    created = await createOperationalEntryInApi({
      payload,
      actorUserId,
      actorRole,
    });
  } catch (error) {
    const message = error instanceof Error && error.message
      ? error.message
      : resolveOperationalEntrySaveFailureMessage(lang);
    return { ok: false, failureMessage: message };
  }
  if (!created) {
    return {
      ok: false,
      failureMessage: resolveOperationalEntrySaveFailureMessage(lang),
    };
  }
  const { refreshed, refreshFailed } = await refreshOperationalEntriesBestEffort(loadOperationalEntriesFromApi);
  return { ok: true, created, refreshed, refreshFailed };
}

export async function persistOperationalEntryLocally({
  payload,
  actor,
  buildEntry,
  storeAttachmentPayload,
}: PersistOperationalEntryLocallyInput): Promise<PersistOperationalEntryLocallyResult> {
  const entry = buildEntry(payload, actor);
  if (entry.attachment) {
    try {
      await storeAttachmentPayload(entry.attachment);
    } catch {
      return { ok: false, attachmentFailed: true };
    }
  }
  return { ok: true, entry };
}

export type {
  CloseoutAlertRecord,
  PendingDuplicateSummaryState,
  ResolveSuggestedEntryDateInput,
};
