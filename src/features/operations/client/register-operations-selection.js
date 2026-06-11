import {
  canRestoreOperationalEntry,
  canVoidOperationalEntry,
} from "@/features/operations/operational-entry-mutation-helpers";

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
export function resolveCloseoutForOperationalEntry(entry, closeouts = []) {
  if (!entry?.closeoutId || !Array.isArray(closeouts)) return null;
  return closeouts.find((item) => item.id === entry.closeoutId) || null;
}

export function resolveOwnerOperationOpenAction(entry, {
  bindsToServerAuth = false,
  closeoutsApiDbSource = false,
  readDailyCloseouts = () => [],
} = {}) {
  if (!bindsToServerAuth && !closeoutsApiDbSource && entry?.type === "summary" && entry.closeoutId) {
    const closeout = resolveCloseoutForOperationalEntry(entry, readDailyCloseouts());
    if (closeout) {
      return { kind: "closeout", closeout, entry: null };
    }
  }
  return { kind: "entry", closeout: null, entry: entry || null };
}
