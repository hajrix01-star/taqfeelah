import { isUuid } from "@/core/client/api-id-utils";

export function employeePinMatches(person, pin, defaultPin = "") {
  const expectedPin = `${person?.pin || defaultPin}`.trim();
  if (!expectedPin) return false;
  return `${pin}`.trim() === expectedPin;
}

export function findActiveStaffMember(staff, loggedInEmployeeId) {
  if (!loggedInEmployeeId) return null;
  return (Array.isArray(staff) ? staff : []).find(
    (person) => (person.id === loggedInEmployeeId || person.apiUserId === loggedInEmployeeId)
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

export function resolveAssignedEmployeeBusinesses(activeBusinesses, activeEmployee) {
  const storeIds = activeEmployee?.storeIds || [];
  return (Array.isArray(activeBusinesses) ? activeBusinesses : []).filter(
    (business) => storeIds.includes(business.id),
  );
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
    (person) => person.apiUserId === sessionUserId || person.id === loggedInEmployeeId,
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
