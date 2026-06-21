import type { CloseoutSyncLang } from "@/features/daily-closeouts/daily-closeouts-types";
import type { DailyCloseoutRecord } from "@/features/daily-closeouts/daily-closeouts-types";
import type { EmployeeActor, EmployeeHistoryVisibility } from "./employee-closeouts-types";
import type { StoreRef } from "@/features/daily-closeouts/daily-closeouts-types";

import { isUuid, mapToUuid } from "@/core/client/api-id-utils";
import { getRuntimeApiMaps } from "@/core/client/runtime-api-maps-state";

/** Compare legacy store ids (shami) with DB UUIDs from org-config hydration. */
export function storeIdsReferToSameStore(left: string | null | undefined, right: string | null | undefined): boolean {
  if (!left || !right) return false;
  if (left === right) return true;
  const { storeIdMap } = getRuntimeApiMaps();
  const leftUuid = isUuid(left) ? left : mapToUuid(left, storeIdMap);
  const rightUuid = isUuid(right) ? right : mapToUuid(right, storeIdMap);
  return Boolean(leftUuid && rightUuid && leftUuid === rightUuid);
}

export function closeoutMatchesStore(closeout: DailyCloseoutRecord | null | undefined, store: StoreRef | null | undefined): boolean {
  if (!closeout?.storeId || !store) return false;
  const storeIds = [store.id, store.dbStoreId, store.legacyId].filter(Boolean) as string[];
  return storeIds.some((storeId) => storeIdsReferToSameStore(closeout.storeId, storeId));
}

/** Owner-controlled window for which past closeouts an employee may view. */

export const EMPLOYEE_HISTORY_VISIBILITY = {
  week: "week",
  month: "month",
  all: "all",
} as const;

/** Server fetch cap when owner selects «الكل» — avoids unbounded closeout list payloads. */
export const EMPLOYEE_CLOSEOUTS_ALL_CAP_DAYS = 90;

export function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function addDaysIso(isoDate: string, deltaDays: number): string {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + deltaDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function firstDayOfCalendarMonthIso(isoDate: string = todayIsoDate()): string {
  const [year, month] = isoDate.split("-");
  return `${year}-${month}-01`;
}

/**
 * Inclusive API date window for employee closeout list loads.
 * Aligns with owner employeeHistoryVisibility per store.
 */
export function resolveEmployeeCloseoutsFetchWindow(
  visibility: EmployeeHistoryVisibility | string | null | undefined,
  todayIso: string = todayIsoDate(),
): { dateFrom: string; dateTo: string } {
  const normalized = visibility || EMPLOYEE_HISTORY_VISIBILITY.month;
  if (normalized === EMPLOYEE_HISTORY_VISIBILITY.week) {
    return { dateFrom: addDaysIso(todayIso, -6), dateTo: todayIso };
  }
  if (normalized === EMPLOYEE_HISTORY_VISIBILITY.month) {
    return { dateFrom: firstDayOfCalendarMonthIso(todayIso), dateTo: todayIso };
  }
  if (normalized === EMPLOYEE_HISTORY_VISIBILITY.all) {
    return {
      dateFrom: addDaysIso(todayIso, -(EMPLOYEE_CLOSEOUTS_ALL_CAP_DAYS - 1)),
      dateTo: todayIso,
    };
  }
  return { dateFrom: firstDayOfCalendarMonthIso(todayIso), dateTo: todayIso };
}

/** Inclusive cutoff date (YYYY-MM-DD): closeouts on or after this date are visible. */
export function employeeHistoryCutoffDate(
  visibility: EmployeeHistoryVisibility | string | null | undefined,
  todayIso: string = todayIsoDate(),
): string {
  const { dateFrom } = resolveEmployeeCloseoutsFetchWindow(visibility, todayIso);
  return dateFrom;
}

export function isCloseoutWithinEmployeeHistory(
  closeout: DailyCloseoutRecord | null | undefined,
  visibility: EmployeeHistoryVisibility | string | null | undefined,
  todayIso: string = todayIsoDate(),
): boolean {
  if (!closeout?.date || !visibility) return true;
  const cutoff = employeeHistoryCutoffDate(visibility, todayIso);
  return closeout.date >= cutoff;
}

export function isEntryDateWithinEmployeeHistory(
  entryDate: string | null | undefined,
  visibility: EmployeeHistoryVisibility | string | null | undefined,
  todayIso: string = todayIsoDate(),
): boolean {
  if (!entryDate || !visibility) return true;
  const cutoff = employeeHistoryCutoffDate(visibility, todayIso);
  return entryDate >= cutoff;
}

function reverseLookupLegacyUserId(value: string, userIdMap: Record<string, string>): string {
  if (!isUuid(value) || !userIdMap || typeof userIdMap !== "object") return "";
  for (const [legacyId, mappedId] of Object.entries(userIdMap)) {
    if (typeof mappedId === "string" && mappedId.toLowerCase() === value.toLowerCase()) return legacyId;
  }
  return "";
}

function mapLegacyUserIdToApi(value: string, userIdMap: Record<string, string>): string {
  if (!value || typeof value !== "string" || !value.trim()) return "";
  if (isUuid(value)) return value;
  const mapped = userIdMap[value] || userIdMap[value.trim()];
  return isUuid(mapped) ? mapped : "";
}

/** Collect comparable actor ids for an employee (legacy id, api uuid, runtime map aliases). */
export function resolveEmployeeActorIds(employee: EmployeeActor | null | undefined): string[] {
  const employeeId = typeof employee === "string" ? employee : employee?.id;
  const apiUserId = typeof employee === "object" ? employee?.apiUserId : "";
  const { userIdMap } = getRuntimeApiMaps();
  const ids = new Set<string>();
  for (const raw of [employeeId, apiUserId]) {
    if (typeof raw !== "string" || !raw.trim()) continue;
    ids.add(raw);
    const mapped = mapLegacyUserIdToApi(raw, userIdMap);
    if (mapped) ids.add(mapped);
    const legacy = reverseLookupLegacyUserId(raw, userIdMap);
    if (legacy) ids.add(legacy);
  }
  return [...ids];
}

function resolveCloseoutActorIds(closeout: DailyCloseoutRecord | null | undefined): string[] {
  const { userIdMap } = getRuntimeApiMaps();
  const ids = new Set<string>();
  for (const raw of [closeout?.openedByUserId, closeout?.submittedByUserId]) {
    if (typeof raw !== "string" || !raw.trim()) continue;
    ids.add(raw);
    const mapped = mapLegacyUserIdToApi(raw, userIdMap);
    if (mapped) ids.add(mapped);
    const legacy = reverseLookupLegacyUserId(raw, userIdMap);
    if (legacy) ids.add(legacy);
  }
  return [...ids];
}

/** Match closeouts opened or submitted by this employee (legacy rows may lack openedByUserId). */
export function closeoutBelongsToEmployee(
  closeout: DailyCloseoutRecord | null | undefined,
  employee: EmployeeActor | null | undefined,
): boolean {
  if (!closeout || !employee) return false;
  const employeeIds = resolveEmployeeActorIds(employee);
  const closeoutIds = resolveCloseoutActorIds(closeout);
  if (employeeIds.some((id) => closeoutIds.includes(id))) return true;

  const candidateNames = typeof employee === "object"
    ? [employee.nameAr, employee.nameEn]
    : [];
  const actorNames = [closeout.openedByName, closeout.submittedByName];
  const normalize = (value: unknown) => String(value || "").trim().toLowerCase();
  const normalizedActors = new Set(actorNames.map(normalize).filter(Boolean));
  return candidateNames.some((name) => normalizedActors.has(normalize(name)));
}

export function employeeHistoryVisibilityLabel(
  visibility: EmployeeHistoryVisibility | string | null | undefined,
  lang: CloseoutSyncLang = "ar",
): string {
  if (visibility === EMPLOYEE_HISTORY_VISIBILITY.week) return lang === "ar" ? "أسبوع" : "Week";
  if (visibility === EMPLOYEE_HISTORY_VISIBILITY.month) return lang === "ar" ? "شهر" : "Month";
  return lang === "ar" ? "الكل" : "All";
}
