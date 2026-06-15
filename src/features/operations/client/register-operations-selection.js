import {
  canRestoreOperationalEntry,
  canVoidOperationalEntry,
} from "@/features/operations/operational-entry-mutation-helpers";

/**
 * @param {Array<Array<{ id?: string }>>} catalogs
 * @param {string} entryId
 */
export function resolveOperationTargetFromCatalogs(catalogs, entryId) {
  if (!entryId) return null;
  for (const catalog of catalogs) {
    if (!Array.isArray(catalog)) continue;
    const target = catalog.find((entry) => entry.id === entryId);
    if (target) return target;
  }
  return null;
}

/**
 * @param {Array<{ id?: string }> | Array<Array<{ id?: string }>>} entryCatalogs
 * @param {string} entryId
 * @param {string[]} archivedBusinessIds
 * @param {(entry: object) => boolean} entryIsVoided
 */
export function resolveVoidOperationTarget(entryCatalogs, entryId, archivedBusinessIds, entryIsVoided) {
  const catalogs = Array.isArray(entryCatalogs?.[0]) ? entryCatalogs : [entryCatalogs];
  const target = resolveOperationTargetFromCatalogs(catalogs, entryId);
  if (!canVoidOperationalEntry(target, archivedBusinessIds, entryIsVoided)) return null;
  return target;
}

/**
 * @param {Array<{ id?: string }> | Array<Array<{ id?: string }>>} entryCatalogs
 * @param {string} entryId
 * @param {string[]} archivedBusinessIds
 * @param {(entry: object) => boolean} entryIsVoided
 */
export function resolveRestoreOperationTarget(entryCatalogs, entryId, archivedBusinessIds, entryIsVoided) {
  const catalogs = Array.isArray(entryCatalogs?.[0]) ? entryCatalogs : [entryCatalogs];
  const target = resolveOperationTargetFromCatalogs(catalogs, entryId);
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
