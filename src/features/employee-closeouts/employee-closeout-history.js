import { isUuid } from "@/core/client/api-id-utils";
import { getRuntimeApiMaps } from "@/core/client/runtime-api-maps-state";

/** Owner-controlled window for which past closeouts an employee may view. */

export const EMPLOYEE_HISTORY_VISIBILITY = {
  week: "week",
  month: "month",
  all: "all",
};

export function todayIsoDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function addDaysIso(isoDate, deltaDays) {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + deltaDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Inclusive cutoff date (YYYY-MM-DD): closeouts on or after this date are visible. */
export function employeeHistoryCutoffDate(visibility, todayIso = todayIsoDate()) {
  if (visibility === EMPLOYEE_HISTORY_VISIBILITY.week) return addDaysIso(todayIso, -6);
  if (visibility === EMPLOYEE_HISTORY_VISIBILITY.month) return addDaysIso(todayIso, -29);
  return null;
}

export function isCloseoutWithinEmployeeHistory(closeout, visibility, todayIso = todayIsoDate()) {
  if (!closeout?.date || visibility === EMPLOYEE_HISTORY_VISIBILITY.all || !visibility) return true;
  const cutoff = employeeHistoryCutoffDate(visibility, todayIso);
  if (!cutoff) return true;
  return closeout.date >= cutoff;
}

export function isEntryDateWithinEmployeeHistory(entryDate, visibility, todayIso = todayIsoDate()) {
  if (!entryDate || visibility === EMPLOYEE_HISTORY_VISIBILITY.all || !visibility) return true;
  const cutoff = employeeHistoryCutoffDate(visibility, todayIso);
  if (!cutoff) return true;
  return entryDate >= cutoff;
}

function reverseLookupLegacyUserId(value, userIdMap) {
  if (!isUuid(value) || !userIdMap || typeof userIdMap !== "object") return "";
  for (const [legacyId, mappedId] of Object.entries(userIdMap)) {
    if (typeof mappedId === "string" && mappedId.toLowerCase() === value.toLowerCase()) return legacyId;
  }
  return "";
}

function mapLegacyUserIdToApi(value, userIdMap) {
  if (!value || typeof value !== "string" || !value.trim()) return "";
  if (isUuid(value)) return value;
  const mapped = userIdMap[value] || userIdMap[value.trim()];
  return isUuid(mapped) ? mapped : "";
}

/** Collect comparable actor ids for an employee (legacy id, api uuid, runtime map aliases). */
export function resolveEmployeeActorIds(employee) {
  const employeeId = typeof employee === "string" ? employee : employee?.id;
  const apiUserId = typeof employee === "object" ? employee?.apiUserId : "";
  const { userIdMap } = getRuntimeApiMaps();
  const ids = new Set();
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

function resolveCloseoutActorIds(closeout) {
  const { userIdMap } = getRuntimeApiMaps();
  const ids = new Set();
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
export function closeoutBelongsToEmployee(closeout, employee) {
  if (!closeout || !employee) return false;
  const employeeIds = resolveEmployeeActorIds(employee);
  const closeoutIds = resolveCloseoutActorIds(closeout);
  if (employeeIds.some((id) => closeoutIds.includes(id))) return true;

  // Legacy prototype rows may miss user IDs; fall back to employee name matching.
  const candidateNames = typeof employee === "object"
    ? [employee.nameAr, employee.nameEn]
    : [];
  const actorNames = [closeout.openedByName, closeout.submittedByName];
  const normalize = (value) => String(value || "").trim().toLowerCase();
  const normalizedActors = new Set(actorNames.map(normalize).filter(Boolean));
  return candidateNames.some((name) => normalizedActors.has(normalize(name)));
}

export function employeeHistoryVisibilityLabel(visibility, lang = "ar") {
  if (visibility === EMPLOYEE_HISTORY_VISIBILITY.week) return lang === "ar" ? "أسبوع" : "Week";
  if (visibility === EMPLOYEE_HISTORY_VISIBILITY.month) return lang === "ar" ? "شهر" : "Month";
  return lang === "ar" ? "الكل" : "All";
}
