import { newestEntries } from "@/features/operations/operational-analytics";
import type { CloseoutSyncLang } from "@/features/daily-closeouts/daily-closeouts-types";
import type { OperationalEntry } from "@/features/entries/client/entries-client-types";

type DisplayEntry = OperationalEntry & {
  employeeAr?: string;
  employeeEn?: string;
};

export function employeeDisplayName(item: DisplayEntry | null | undefined, lang: CloseoutSyncLang): string {
  if (item?.enteredBy) {
    return lang === "ar" ? String(item.enteredBy.nameAr || "") : String(item.enteredBy.nameEn || "");
  }
  return lang === "ar" ? String(item?.employeeAr || "") : String(item?.employeeEn || "");
}

export function entryBelongsToEmployeeStore(
  entry: OperationalEntry | null | undefined,
  storeId: string,
  employeeId: string,
): boolean {
  return entry?.businessId === storeId && entry?.enteredBy?.userId === employeeId;
}

export function filterEmployeeStoreEntries(
  entries: OperationalEntry[] | null | undefined,
  storeId: string,
  employeeId: string,
): OperationalEntry[] {
  return (Array.isArray(entries) ? entries : []).filter(
    (entry) => entryBelongsToEmployeeStore(entry, storeId, employeeId),
  );
}

export function filterEmployeeHomePreviewEntries(
  entries: OperationalEntry[] | null | undefined,
  storeId: string,
  employeeId: string,
  limit = 4,
): OperationalEntry[] {
  return newestEntries(filterEmployeeStoreEntries(entries, storeId, employeeId)).slice(0, limit);
}
