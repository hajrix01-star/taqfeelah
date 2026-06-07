import { normalizeTeamEmployeePins } from "./owner-settings-local-persistence";

/**
 * @typedef {Object} StaffMember
 * @property {string} id
 * @property {boolean} [active]
 * @property {string[]} [storeIds]
 * @property {string} [pin]
 * @property {string} [nameAr]
 * @property {string} [nameEn]
 * @property {string} [mobile]
 */

/**
 * @param {StaffMember[]} staff
 * @returns {StaffMember[]}
 */
export function cloneStaffDraft(staff) {
  return staff.map((person) => ({ ...person, storeIds: [...(person.storeIds || [])] }));
}

/**
 * @param {StaffMember[]} draftStaff
 * @param {Object} [options]
 * @param {Record<string, string>} [options.draftAuthEmployeePins]
 * @param {Record<string, string>} [options.authEmployeePins]
 * @param {string} [options.defaultPin]
 */
export function prepareSavedTeamDraft(
  draftStaff,
  { draftAuthEmployeePins = {}, authEmployeePins = {}, defaultPin = "1234" } = {},
) {
  const staff = draftStaff.map((person) => ({
    ...person,
    pin: draftAuthEmployeePins?.[person.id] || person.pin || defaultPin,
  }));

  return {
    staff,
    employeePins: normalizeTeamEmployeePins({
      authEmployeePins,
      draftAuthEmployeePins,
      staff,
    }),
  };
}

/**
 * @param {Object} input
 * @param {string} input.name
 * @param {string[]} input.storeIds
 * @param {boolean} input.managingTeam
 */
export function canAddStaffMember({ name, storeIds, managingTeam }) {
  return Boolean(name.trim() && storeIds.length > 0 && managingTeam);
}

/**
 * @param {Object} input
 * @param {string} input.name
 * @param {string} input.mobile
 * @param {string[]} input.storeIds
 * @param {string} [input.defaultPin]
 * @param {string} [input.id]
 */
export function buildNewStaffMember({
  name,
  mobile,
  storeIds,
  defaultPin = "1234",
  id,
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

/**
 * @param {StaffMember[]} staffDraft
 * @param {string} personId
 */
export function toggleEmployeeActiveInDraft(staffDraft, personId) {
  return staffDraft.map((person) => (
    person.id === personId ? { ...person, active: !person.active } : person
  ));
}

/**
 * @param {StaffMember} person
 * @param {string} [fallbackStoreId]
 */
export function resolveEmployeeStoreIds(person, fallbackStoreId = "shami") {
  return person.storeIds || [fallbackStoreId];
}

/**
 * @param {StaffMember[]} staffDraft
 * @param {string} personId
 * @param {string} storeId
 * @param {string} [fallbackStoreId]
 */
export function toggleEmployeeStoreInDraft(staffDraft, personId, storeId, fallbackStoreId = "shami") {
  return staffDraft.map((person) => {
    if (person.id !== personId) return person;
    const assigned = resolveEmployeeStoreIds(person, fallbackStoreId);
    const next = assigned.includes(storeId)
      ? assigned.filter((item) => item !== storeId)
      : [...assigned, storeId];
    return { ...person, storeIds: next.length ? next : assigned };
  });
}

/**
 * @param {string[]} storeIds
 * @param {string} storeId
 */
export function toggleStoreSelection(storeIds, storeId) {
  return storeIds.includes(storeId)
    ? storeIds.filter((item) => item !== storeId)
    : [...storeIds, storeId];
}

/**
 * @param {Record<string, unknown>} person
 */
export function buildStaffDeleteTarget(person) {
  return { type: "staff", item: person };
}

/**
 * @param {unknown} failure
 * @param {"ar" | "en"} [lang]
 */
export function resolveTeamSaveFailureMessage(failure, lang = "ar") {
  if (failure instanceof Error && failure.message) return failure.message;
  return lang === "ar" ? "تعذر حفظ الفريق على الخادم." : "Failed to save team on server.";
}
