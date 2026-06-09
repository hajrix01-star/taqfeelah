import { refreshOperationalEntriesBestEffort } from "./client/refresh-operational-entries-best-effort";
import {
  resolveLatestActiveCloseoutDateFromEntries,
  resolveOperationalEntrySaveFailureMessage,
} from "./operational-entry-save-helpers";

/**
 * @param {Object} input
 * @param {boolean} input.saving
 * @param {Record<string, unknown> | null | undefined} input.payload
 * @param {string[]} input.allowedBusinessIds
 */
export function canPersistOperationalEntry({ saving, payload, allowedBusinessIds }) {
  return !saving
    && Boolean(payload?.businessId)
    && allowedBusinessIds.includes(String(payload.businessId));
}

/**
 * @param {Record<string, unknown>} employee
 */
export function buildEmployeeEntryActor(employee) {
  return {
    role: "employee",
    userId: employee.id,
    nameAr: employee.nameAr,
    nameEn: employee.nameEn,
  };
}

/**
 * @param {Record<string, unknown>} payload
 */
export function shouldGateSummarySaveOnDuplicates(payload) {
  return payload?.type === "summary";
}

/**
 * @param {Record<string, unknown>} payload
 * @param {Array<Record<string, unknown>>} previousEntries
 * @param {"owner" | "employee" | undefined} [actor]
 */
export function buildPendingDuplicateSummaryState(payload, previousEntries, actor) {
  return actor ? { payload, previousEntries, actor } : { payload, previousEntries };
}

/**
 * @param {Array<Record<string, unknown>>} refreshed
 * @param {string | undefined} createdId
 */
export function findCreatedEntryInRefreshedList(refreshed, createdId) {
  if (!createdId) return null;
  return refreshed.find((entry) => entry.id === createdId) || null;
}

/**
 * @param {Record<string, unknown>} payload
 * @param {Array<Record<string, unknown>>} refreshed
 * @param {string} createdId
 * @param {(entry: Record<string, unknown>) => boolean} isActive
 */
export function resolveSummaryLastCloseoutUpdate(payload, refreshed, createdId, isActive) {
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

/**
 * @param {Object} deps
 * @param {(args: Record<string, unknown>) => Promise<Record<string, unknown> | null>} deps.createOperationalEntryInApi
 * @param {() => Promise<Array<Record<string, unknown>>>} deps.loadOperationalEntriesFromApi
 * @param {Record<string, unknown>} deps.payload
 * @param {string} deps.actorUserId
 * @param {"owner" | "employee"} deps.actorRole
 * @param {"ar" | "en"} [deps.lang]
 */
export async function persistOperationalEntryThroughApi({
  createOperationalEntryInApi,
  loadOperationalEntriesFromApi,
  payload,
  actorUserId,
  actorRole,
  lang = "ar",
}) {
  let created;
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

/**
 * @param {Object} deps
 * @param {Record<string, unknown>} deps.payload
 * @param {Record<string, unknown>} deps.actor
 * @param {(payload: Record<string, unknown>, actor: Record<string, unknown>) => Record<string, unknown>} deps.buildEntry
 * @param {(attachment: Record<string, unknown>) => Promise<void>} deps.storeAttachmentPayload
 */
export async function persistOperationalEntryLocally({
  payload,
  actor,
  buildEntry,
  storeAttachmentPayload,
}) {
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
