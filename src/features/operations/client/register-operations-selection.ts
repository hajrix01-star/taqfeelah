import {
  canRestoreOperationalEntry,
  canVoidOperationalEntry,
} from "@/features/operations/operational-entry-mutation-helpers";
import type {
  CloseoutRecord,
  EntryIsVoidedFn,
  OperationalEntry,
  OwnerOperationOpenAction,
} from "./operations-client-types";

export function resolveOperationTargetFromCatalogs(
  catalogs: OperationalEntry[][],
  entryId: string,
): OperationalEntry | null {
  if (!entryId) return null;
  for (const catalog of catalogs) {
    if (!Array.isArray(catalog)) continue;
    const target = catalog.find((entry) => entry.id === entryId);
    if (target) return target;
  }
  return null;
}

export function resolveVoidOperationTarget(
  entryCatalogs: OperationalEntry[] | OperationalEntry[][],
  entryId: string,
  archivedBusinessIds: string[],
  entryIsVoided: EntryIsVoidedFn,
): OperationalEntry | null {
  const catalogs = Array.isArray(entryCatalogs?.[0]) ? entryCatalogs as OperationalEntry[][] : [entryCatalogs as OperationalEntry[]];
  const target = resolveOperationTargetFromCatalogs(catalogs, entryId);
  if (!canVoidOperationalEntry(target, archivedBusinessIds, entryIsVoided)) return null;
  return target;
}

export function resolveRestoreOperationTarget(
  entryCatalogs: OperationalEntry[] | OperationalEntry[][],
  entryId: string,
  archivedBusinessIds: string[],
  entryIsVoided: EntryIsVoidedFn,
): OperationalEntry | null {
  const catalogs = Array.isArray(entryCatalogs?.[0]) ? entryCatalogs as OperationalEntry[][] : [entryCatalogs as OperationalEntry[]];
  const target = resolveOperationTargetFromCatalogs(catalogs, entryId);
  if (!canRestoreOperationalEntry(target, archivedBusinessIds, entryIsVoided)) return null;
  return target;
}

export function resolveCloseoutForOperationalEntry(
  entry: Pick<OperationalEntry, "closeoutId"> | null | undefined,
  closeouts: CloseoutRecord[] = [],
): CloseoutRecord | null {
  if (!entry?.closeoutId || !Array.isArray(closeouts)) return null;
  return closeouts.find((item) => item.id === entry.closeoutId) || null;
}

export function resolveOwnerOperationOpenAction(
  entry: OperationalEntry | null | undefined,
  {
    bindsToServerAuth = false,
    closeoutsApiDbSource = false,
    readDailyCloseouts = () => [] as CloseoutRecord[],
  }: {
    bindsToServerAuth?: boolean;
    closeoutsApiDbSource?: boolean;
    readDailyCloseouts?: () => CloseoutRecord[];
  } = {},
): OwnerOperationOpenAction {
  if (!bindsToServerAuth && !closeoutsApiDbSource && entry?.type === "summary" && entry.closeoutId) {
    const closeout = resolveCloseoutForOperationalEntry(entry, readDailyCloseouts());
    if (closeout) {
      return { kind: "closeout", closeout, entry: null };
    }
  }
  return { kind: "entry", closeout: null, entry: entry || null };
}
