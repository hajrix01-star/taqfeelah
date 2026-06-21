import { normalizeTeamEmployeePins } from "./owner-settings-local-persistence";
import type { StaffMember } from "./org-config-client-types";

export function cloneStaffDraft(staff: StaffMember[]): StaffMember[] {
  return staff.map((person) => ({ ...person, storeIds: [...(person.storeIds || [])] }));
}

export function prepareSavedTeamDraft(
  draftStaff: StaffMember[],
  {
    draftAuthEmployeePins = {},
    authEmployeePins = {},
    defaultPin = "1234",
    pinsFromAuthIdentitiesOnly = false,
  }: {
    draftAuthEmployeePins?: Record<string, string>;
    authEmployeePins?: Record<string, string>;
    defaultPin?: string;
    pinsFromAuthIdentitiesOnly?: boolean;
  } = {},
) {
  const staff = draftStaff.map((person) => {
    const draftPin = draftAuthEmployeePins?.[person.id]?.trim();
    if (pinsFromAuthIdentitiesOnly) {
      return {
        ...person,
        pin: draftPin || person.pin || "",
      };
    }
    return {
      ...person,
      pin: draftPin || person.pin || defaultPin,
    };
  });

  return {
    staff,
    employeePins: pinsFromAuthIdentitiesOnly
      ? Object.fromEntries(
        staff
          .map((person) => [person.id, draftAuthEmployeePins?.[person.id]?.trim() || ""])
          .filter(([, pin]) => Boolean(pin)),
      )
      : normalizeTeamEmployeePins({
        authEmployeePins,
        draftAuthEmployeePins,
        staff,
      }),
  };
}

export function canAddStaffMember({
  name,
  storeIds,
  managingTeam,
}: {
  name: string;
  storeIds: string[];
  managingTeam: boolean;
}) {
  return Boolean(name.trim() && storeIds.length > 0 && managingTeam);
}

export function buildNewStaffMember({
  name,
  mobile,
  storeIds,
  defaultPin = "1234",
  id,
}: {
  name: string;
  mobile: string;
  storeIds: string[];
  defaultPin?: string;
  id?: string;
}) {
  const staffId = id || `staff-${Date.now()}`;
  const trimmedName = name.trim();

  return {
    member: {
      id: staffId,
      nameAr: trimmedName,
      nameEn: trimmedName,
      mobile: mobile.trim(),
      active: true,
      storeIds,
      pin: defaultPin,
    },
    employeePinsPatch: { [staffId]: defaultPin || "1234" },
  };
}

export function toggleEmployeeActiveInDraft(staffDraft: StaffMember[], personId: string) {
  return staffDraft.map((person) => (
    person.id === personId ? { ...person, active: !person.active } : person
  ));
}

export function resolveEmployeeStoreIds(person: StaffMember, fallbackStoreId = "shami") {
  return person.storeIds || [fallbackStoreId];
}

export function updateEmployeeMobileInDraft(staffDraft: StaffMember[], personId: string, mobile: string) {
  return staffDraft.map((person) => (
    person.id === personId ? { ...person, mobile } : person
  ));
}

export function toggleEmployeeStoreInDraft(
  staffDraft: StaffMember[],
  personId: string,
  storeId: string,
  fallbackStoreId = "shami",
) {
  return staffDraft.map((person) => {
    if (person.id !== personId) return person;
    const assigned = resolveEmployeeStoreIds(person, fallbackStoreId);
    const next = assigned.includes(storeId)
      ? assigned.filter((item) => item !== storeId)
      : [...assigned, storeId];
    return { ...person, storeIds: next.length ? next : assigned };
  });
}

export function toggleStoreSelection(storeIds: string[], storeId: string) {
  return storeIds.includes(storeId)
    ? storeIds.filter((item) => item !== storeId)
    : [...storeIds, storeId];
}

export function buildStaffDeleteTarget(person: Record<string, unknown>) {
  return { type: "staff", item: person };
}

export function resolveTeamSaveFailureMessage(failure: unknown, lang: "ar" | "en" = "ar") {
  if (failure instanceof Error && failure.message) return failure.message;
  return lang === "ar" ? "تعذر حفظ الفريق على الخادم." : "Failed to save team on server.";
}
