import { isUuid } from "@/core/client/api-id-utils";
import type { StoreRef } from "@/features/daily-closeouts/daily-closeouts-types";
import type { CloseoutSyncLang } from "@/features/daily-closeouts/daily-closeouts-types";
import type { EmployeeStaffMember, RuntimeApiMaps } from "./employee-closeouts-types";

export function employeePinMatches(
  person: { pin?: string } | null | undefined,
  pin: string,
  defaultPin = "",
): boolean {
  const expectedPin = `${person?.pin || defaultPin}`.trim();
  if (!expectedPin) return false;
  return `${pin}`.trim() === expectedPin;
}

export function findActiveStaffMember(
  staff: EmployeeStaffMember[] | null | undefined,
  loggedInEmployeeId: string,
): EmployeeStaffMember | null {
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

export function enrichActiveEmployeeWithSessionUserId(
  activeEmployee: EmployeeStaffMember | null,
  sessionUserId: string,
  uuidChecker: (value: string) => boolean = isUuid,
): EmployeeStaffMember | null {
  if (!activeEmployee) return null;
  if (activeEmployee.apiUserId || !uuidChecker(sessionUserId)) return activeEmployee;
  return { ...activeEmployee, apiUserId: sessionUserId };
}

export function resolveEmployeeDisplayName(
  employee: { nameAr?: string; nameEn?: string } | null | undefined,
  lang: CloseoutSyncLang = "ar",
  fallbackName = "",
): string {
  const localized = employee
    ? (lang === "ar" ? employee.nameAr || employee.nameEn : employee.nameEn || employee.nameAr)
    : "";
  return (localized || fallbackName || "").trim();
}

export function resolveActiveEmployee({
  employee = false,
  loggedInEmployeeId = "",
  staff = [],
  sessionUserId = "",
  uuidChecker = isUuid,
}: {
  employee?: boolean;
  loggedInEmployeeId?: string;
  staff?: EmployeeStaffMember[];
  sessionUserId?: string;
  uuidChecker?: (value: string) => boolean;
}): EmployeeStaffMember | null {
  if (!employee || !loggedInEmployeeId) return null;
  const raw = findActiveStaffMember(staff, loggedInEmployeeId);
  return enrichActiveEmployeeWithSessionUserId(raw, sessionUserId, uuidChecker);
}

function businessMatchesEmployeeStoreId(business: StoreRef, storeId: string): boolean {
  if (!storeId || !business) return false;
  return business.id === storeId
    || business.dbStoreId === storeId
    || business.legacyId === storeId;
}

export function resolveAssignedEmployeeBusinesses(
  activeBusinesses: StoreRef[] | null | undefined,
  activeEmployee: EmployeeStaffMember | null | undefined,
): StoreRef[] {
  const storeIds = activeEmployee?.storeIds || [];
  if (!storeIds.length) return [];
  return (Array.isArray(activeBusinesses) ? activeBusinesses : []).filter(
    (business) => storeIds.some((storeId) => businessMatchesEmployeeStoreId(business, storeId)),
  );
}

export function synthesizeEmployeeBusinessesFromStoreIds(storeIds: string[] = []): StoreRef[] {
  return storeIds
    .filter((storeId): storeId is string => typeof storeId === "string" && Boolean(storeId.trim()))
    .map((storeId) => ({
      id: storeId,
      dbStoreId: storeId,
      nameAr: "",
      nameEn: "",
      displayName: "",
    }));
}

export function resolveCurrentEmployeeBusiness(
  assignedBusinesses: StoreRef[] | null | undefined,
  employeeBusinessId: string,
): StoreRef | null {
  const list = Array.isArray(assignedBusinesses) ? assignedBusinesses : [];
  return list.find((business) => business.id === employeeBusinessId) || list[0] || null;
}

export function resolveEmployeeBusinessId(
  assignedBusinesses: StoreRef[] | null | undefined,
  currentBusinessId: string,
): string {
  const list = Array.isArray(assignedBusinesses) ? assignedBusinesses : [];
  if (!list.length) return currentBusinessId;
  if (list.some((business) => business.id === currentBusinessId)) return currentBusinessId;
  return list[0]?.id || currentBusinessId;
}

export function syncLoggedInEmployeeIdFromSession(
  staff: EmployeeStaffMember[] | null | undefined,
  sessionUserId: string,
  loggedInEmployeeId: string | null | undefined,
): string | null {
  if (!sessionUserId) return null;
  const matched = (Array.isArray(staff) ? staff : []).find(
    (person) => person.apiUserId === sessionUserId || person.id === loggedInEmployeeId || person.legacyId === loggedInEmployeeId,
  );
  if (matched?.id && matched.id !== loggedInEmployeeId) return matched.id;
  return null;
}

export function patchRuntimeApiMapsForEmployeeSession(
  maps: RuntimeApiMaps,
  {
    employee = false,
    loggedInEmployeeId = "",
    sessionUserId = "",
    uuidChecker = isUuid,
  }: {
    employee?: boolean;
    loggedInEmployeeId?: string;
    sessionUserId?: string;
    uuidChecker?: (value: string) => boolean;
  },
): RuntimeApiMaps {
  if (!employee || !loggedInEmployeeId || !uuidChecker(sessionUserId)) return maps;
  return {
    ...maps,
    userIdMap: {
      ...maps.userIdMap,
      [loggedInEmployeeId]: sessionUserId,
    },
  };
}

export function normalizeEmployeeLoginRosterStaff(payload: { staff?: EmployeeStaffMember[] } | null | undefined): EmployeeStaffMember[] {
  if (!Array.isArray(payload?.staff)) return [];
  return payload.staff.map((person) => ({
    ...person,
    active: true,
    removed: false,
  }));
}

export function resolveEmployeeLoginStaff(
  staff: EmployeeStaffMember[] | null | undefined,
  rosterStaff: EmployeeStaffMember[] | null | undefined,
  useProductionRoster: boolean,
): EmployeeStaffMember[] {
  const base = Array.isArray(staff) ? staff : [];
  const roster = Array.isArray(rosterStaff) ? rosterStaff : [];
  if (!useProductionRoster) return base;
  const activeInStaff = base.filter((person) => person.active && !person.removed);
  return activeInStaff.length > 0 ? base : roster;
}

export function filterActiveLoginStaff(loginStaff: EmployeeStaffMember[] | null | undefined): EmployeeStaffMember[] {
  return (Array.isArray(loginStaff) ? loginStaff : []).filter(
    (person) => person.active && !person.removed,
  );
}

export function employeeMatchesSession(
  staffPerson: EmployeeStaffMember | null | undefined,
  loggedInEmployeeId: string,
  sessionUserId = "",
): boolean {
  if (!staffPerson || !loggedInEmployeeId) return false;
  return staffPerson.id === loggedInEmployeeId
    || staffPerson.apiUserId === loggedInEmployeeId
    || staffPerson.apiUserId === sessionUserId
    || staffPerson.legacyId === loggedInEmployeeId;
}

function findStaffPersonForEmployeeSession(
  staff: EmployeeStaffMember[],
  loggedInEmployeeId: string,
  sessionUserId = "",
): EmployeeStaffMember | null {
  const list = Array.isArray(staff) ? staff : [];
  return findActiveStaffMember(list, loggedInEmployeeId)
    || list.find((person) => employeeMatchesSession(person, loggedInEmployeeId, sessionUserId))
    || null;
}

function rosterPersonMatchesEmployee(
  rosterPerson: EmployeeStaffMember,
  loggedInEmployeeId: string,
  sessionUserId = "",
): boolean {
  if (!rosterPerson) return false;
  return employeeMatchesSession(rosterPerson, loggedInEmployeeId, sessionUserId);
}

function employeeStoreIdsNeedHydration(
  employeeRow: EmployeeStaffMember | null | undefined,
  businesses: StoreRef[],
): boolean {
  if (!employeeRow) return false;
  if (!employeeRow.storeIds?.length) return true;
  return resolveAssignedEmployeeBusinesses(businesses, employeeRow).length === 0;
}

export function patchEmployeeStaffStoreIdsFromHydration({
  staff = [],
  loggedInEmployeeId = "",
  sessionUserId = "",
  configuredBusinesses = [],
  employeeBusinessId = "",
}: {
  staff?: EmployeeStaffMember[];
  loggedInEmployeeId?: string;
  sessionUserId?: string;
  configuredBusinesses?: Array<StoreRef | Record<string, unknown>>;
  employeeBusinessId?: string;
}): { staff: EmployeeStaffMember[]; employeeBusinessId: string } {
  const businesses = (Array.isArray(configuredBusinesses) ? configuredBusinesses : [])
    .map((business) => business as StoreRef)
    .filter((business): business is StoreRef => typeof business?.id === "string" && Boolean(business.id.trim()));
  if (!businesses.length || !loggedInEmployeeId) {
    return { staff, employeeBusinessId };
  }

  const storeIds = businesses.map((business) => business.id);
  let currentStaff: EmployeeStaffMember[] = Array.isArray(staff) ? staff : [];
  let employeeRow = findStaffPersonForEmployeeSession(currentStaff, loggedInEmployeeId, sessionUserId);

  if (!employeeRow) {
    employeeRow = {
      id: loggedInEmployeeId,
      apiUserId: sessionUserId || loggedInEmployeeId,
      legacyId: "",
      active: true,
      removed: false,
      storeIds: [],
    };
    currentStaff = [employeeRow, ...currentStaff];
  }

  const needsStoreIds = employeeStoreIdsNeedHydration(employeeRow, businesses);
  const nextStaff = needsStoreIds
    ? currentStaff.map((person) => (
      rosterPersonMatchesEmployee(person, loggedInEmployeeId, sessionUserId)
        ? {
          ...person,
          active: true,
          removed: false,
          storeIds,
        }
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

export function upsertRuntimeEmployeeRosterStaff(
  staff: EmployeeStaffMember[] | null | undefined,
  rosterPerson: EmployeeStaffMember | null | undefined,
): EmployeeStaffMember[] {
  if (!rosterPerson?.id) return Array.isArray(staff) ? staff : [];

  const currentStaff = Array.isArray(staff) ? staff : [];
  const index = currentStaff.findIndex((person) => (
    person.id === rosterPerson.id
    || (rosterPerson.apiUserId && person.apiUserId === rosterPerson.apiUserId)
    || (rosterPerson.legacyId && person.legacyId === rosterPerson.legacyId)
  ));

  if (index < 0) return [rosterPerson, ...currentStaff];

  const existing = currentStaff[index];
  const merged: EmployeeStaffMember = {
    ...existing,
    ...rosterPerson,
    active: true,
    removed: false,
    storeIds: rosterPerson.storeIds?.length ? rosterPerson.storeIds : (existing.storeIds || []),
  };

  return currentStaff.map((person, personIndex) => (
    personIndex === index ? merged : person
  ));
}
