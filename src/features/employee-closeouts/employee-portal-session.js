import { isUuid } from "@/core/client/api-id-utils";

export function employeePinMatches(person, pin, defaultPin = "") {
  const expectedPin = `${person?.pin || defaultPin}`.trim();
  if (!expectedPin) return false;
  return `${pin}`.trim() === expectedPin;
}

export function findActiveStaffMember(staff, loggedInEmployeeId) {
  if (!loggedInEmployeeId) return null;
  return (Array.isArray(staff) ? staff : []).find(
    (person) => (
      person.id === loggedInEmployeeId
      || person.apiUserId === loggedInEmployeeId
      || person.legacyId === loggedInEmployeeId
    )
      && person.active
      && !person.removed,
  ) || null;
}

export function enrichActiveEmployeeWithSessionUserId(activeEmployee, sessionUserId, uuidChecker = isUuid) {
  if (!activeEmployee) return null;
  if (activeEmployee.apiUserId || !uuidChecker(sessionUserId)) return activeEmployee;
  return { ...activeEmployee, apiUserId: sessionUserId };
}

/** @param {{ employee?: boolean, loggedInEmployeeId?: string, staff?: object[], sessionUserId?: string, uuidChecker?: (value: string) => boolean }} params */
export function resolveActiveEmployee({
  employee = false,
  loggedInEmployeeId = "",
  staff = [],
  sessionUserId = "",
  uuidChecker = isUuid,
}) {
  if (!employee || !loggedInEmployeeId) return null;
  const raw = findActiveStaffMember(staff, loggedInEmployeeId);
  return enrichActiveEmployeeWithSessionUserId(raw, sessionUserId, uuidChecker);
}

function businessMatchesEmployeeStoreId(business, storeId) {
  if (!storeId || !business) return false;
  return business.id === storeId
    || business.dbStoreId === storeId
    || business.legacyId === storeId;
}

export function resolveAssignedEmployeeBusinesses(activeBusinesses, activeEmployee) {
  const storeIds = activeEmployee?.storeIds || [];
  if (!storeIds.length) return [];
  return (Array.isArray(activeBusinesses) ? activeBusinesses : []).filter(
    (business) => storeIds.some((storeId) => businessMatchesEmployeeStoreId(business, storeId)),
  );
}

export function synthesizeEmployeeBusinessesFromStoreIds(storeIds = []) {
  return storeIds
    .filter((storeId) => typeof storeId === "string" && storeId.trim())
    .map((storeId) => ({
      id: storeId,
      dbStoreId: storeId,
      nameAr: "",
      nameEn: "",
      displayName: "",
    }));
}

export function resolveCurrentEmployeeBusiness(assignedBusinesses, employeeBusinessId) {
  const list = Array.isArray(assignedBusinesses) ? assignedBusinesses : [];
  return list.find((business) => business.id === employeeBusinessId) || list[0] || null;
}

export function resolveEmployeeBusinessId(assignedBusinesses, currentBusinessId) {
  const list = Array.isArray(assignedBusinesses) ? assignedBusinesses : [];
  if (!list.length) return currentBusinessId;
  if (list.some((business) => business.id === currentBusinessId)) return currentBusinessId;
  return list[0].id;
}

export function syncLoggedInEmployeeIdFromSession(staff, sessionUserId, loggedInEmployeeId) {
  if (!sessionUserId) return null;
  const matched = (Array.isArray(staff) ? staff : []).find(
    (person) => person.apiUserId === sessionUserId || person.id === loggedInEmployeeId || person.legacyId === loggedInEmployeeId,
  );
  if (matched?.id && matched.id !== loggedInEmployeeId) return matched.id;
  return null;
}

export function patchRuntimeApiMapsForEmployeeSession(maps, {
  employee = false,
  loggedInEmployeeId = "",
  sessionUserId = "",
  uuidChecker = isUuid,
}) {
  if (!employee || !loggedInEmployeeId || !uuidChecker(sessionUserId)) return maps;
  return {
    ...maps,
    userIdMap: {
      ...maps.userIdMap,
      [loggedInEmployeeId]: sessionUserId,
    },
  };
}

export function normalizeEmployeeLoginRosterStaff(payload) {
  if (!Array.isArray(payload?.staff)) return [];
  return payload.staff.map((person) => ({
    ...person,
    active: true,
    removed: false,
  }));
}

export function resolveEmployeeLoginStaff(staff, rosterStaff, useProductionRoster) {
  const base = Array.isArray(staff) ? staff : [];
  const roster = Array.isArray(rosterStaff) ? rosterStaff : [];
  if (!useProductionRoster) return base;
  const activeInStaff = base.filter((person) => person.active && !person.removed);
  return activeInStaff.length > 0 ? base : roster;
}

export function filterActiveLoginStaff(loginStaff) {
  return (Array.isArray(loginStaff) ? loginStaff : []).filter(
    (person) => person.active && !person.removed,
  );
}

export function employeeMatchesSession(staffPerson, loggedInEmployeeId, sessionUserId = "") {
  if (!staffPerson || !loggedInEmployeeId) return false;
  return staffPerson.id === loggedInEmployeeId
    || staffPerson.apiUserId === loggedInEmployeeId
    || staffPerson.apiUserId === sessionUserId
    || staffPerson.legacyId === loggedInEmployeeId;
}

/**
 * After employee runtime hydration, backfill missing roster storeIds from API stores.
 * @param {Object} input
 * @param {Array<Record<string, unknown>>} [input.staff]
 * @param {string} [input.loggedInEmployeeId]
 * @param {string} [input.sessionUserId]
 * @param {Array<{ id?: string }>} [input.configuredBusinesses]
 * @param {string} [input.employeeBusinessId]
 */
export function patchEmployeeStaffStoreIdsFromHydration({
  staff = [],
  loggedInEmployeeId = "",
  sessionUserId = "",
  configuredBusinesses = [],
  employeeBusinessId = "",
}) {
  const businesses = (Array.isArray(configuredBusinesses) ? configuredBusinesses : [])
    .filter((business) => typeof business?.id === "string" && business.id.trim());
  if (!businesses.length || !loggedInEmployeeId) {
    return { staff, employeeBusinessId };
  }

  const storeIds = businesses.map((business) => business.id);
  const currentStaff = Array.isArray(staff) ? staff : [];
  const employeeRow = findActiveStaffMember(currentStaff, loggedInEmployeeId)
    || currentStaff.find((person) => employeeMatchesSession(person, loggedInEmployeeId, sessionUserId));

  if (!employeeRow) {
    return { staff: currentStaff, employeeBusinessId };
  }

  const needsStoreIds = !employeeRow.storeIds?.length;
  const nextStaff = needsStoreIds
    ? currentStaff.map((person) => (
      employeeMatchesSession(person, loggedInEmployeeId, sessionUserId)
        ? { ...person, storeIds }
        : person
    ))
    : currentStaff;

  const effectiveEmployee = needsStoreIds ? { ...employeeRow, storeIds } : employeeRow;
  const assigned = resolveAssignedEmployeeBusinesses(businesses, effectiveEmployee);
  const nextBusinessId = resolveEmployeeBusinessId(assigned, employeeBusinessId);

  return {
    staff: nextStaff,
    employeeBusinessId: nextBusinessId,
  };
}
