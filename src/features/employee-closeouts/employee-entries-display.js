import { newestEntries } from "@/features/operations/operational-analytics";

export function employeeDisplayName(item, lang) {
  if (item?.enteredBy) {
    return lang === "ar" ? item.enteredBy.nameAr : item.enteredBy.nameEn;
  }
  return lang === "ar" ? item?.employeeAr : item?.employeeEn;
}

export function entryBelongsToEmployeeStore(entry, storeId, employeeId) {
  return entry?.businessId === storeId && entry?.enteredBy?.userId === employeeId;
}

export function filterEmployeeStoreEntries(entries, storeId, employeeId) {
  return (Array.isArray(entries) ? entries : []).filter(
    (entry) => entryBelongsToEmployeeStore(entry, storeId, employeeId),
  );
}

export function filterEmployeeHomePreviewEntries(entries, storeId, employeeId, limit = 4) {
  return newestEntries(filterEmployeeStoreEntries(entries, storeId, employeeId)).slice(0, limit);
}
