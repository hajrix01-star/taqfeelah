import {
  canRestoreOperationalEntry,
  canVoidOperationalEntry,
} from "@/features/operations/operational-entry-mutation-helpers";

/**
 * @param {Object | null | undefined} selected
 * @param {(businessId: string) => boolean} reviewEnabledForBusiness
 * @param {string[]} archivedBusinessIds
 * @param {boolean} ownerReviewEnabled
 */
export function resolveSelectedOperationReviewEnabled(
  selected,
  reviewEnabledForBusiness,
  archivedBusinessIds,
  ownerReviewEnabled,
) {
  return selected
    ? reviewEnabledForBusiness(selected.businessId) && !archivedBusinessIds.includes(selected.businessId)
    : ownerReviewEnabled;
}

/**
 * @param {Array<{ id?: string }>} operationalEntries
 * @param {string} entryId
 * @param {string[]} archivedBusinessIds
 * @param {(entry: object) => boolean} entryIsVoided
 */
export function resolveVoidOperationTarget(operationalEntries, entryId, archivedBusinessIds, entryIsVoided) {
  const target = operationalEntries.find((entry) => entry.id === entryId);
  if (!canVoidOperationalEntry(target, archivedBusinessIds, entryIsVoided)) return null;
  return target;
}

/**
 * @param {Array<{ id?: string }>} operationalEntries
 * @param {string} entryId
 * @param {string[]} archivedBusinessIds
 * @param {(entry: object) => boolean} entryIsVoided
 */
export function resolveRestoreOperationTarget(operationalEntries, entryId, archivedBusinessIds, entryIsVoided) {
  const target = operationalEntries.find((entry) => entry.id === entryId);
  if (!canRestoreOperationalEntry(target, archivedBusinessIds, entryIsVoided)) return null;
  return target;
}

/**
 * @param {Object | null | undefined} entry
 * @param {Object} input
 * @param {boolean} [input.bindsToServerAuth]
 * @param {boolean} [input.closeoutsApiDbSource]
 * @param {() => Array<{ id?: string }>} [input.readDailyCloseouts]
 */
export function resolveOwnerOperationOpenAction(entry, {
  bindsToServerAuth = false,
  closeoutsApiDbSource = false,
  readDailyCloseouts = () => [],
} = {}) {
  if (!bindsToServerAuth && !closeoutsApiDbSource && entry?.type === "summary" && entry.closeoutId) {
    const closeout = readDailyCloseouts().find((item) => item.id === entry.closeoutId);
    if (closeout) {
      return { kind: "closeout", closeout, entry: null };
    }
  }
  return { kind: "entry", closeout: null, entry: entry || null };
}
