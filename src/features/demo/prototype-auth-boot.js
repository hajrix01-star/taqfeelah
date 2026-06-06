import { resolveAuthStateFromSession } from "./login-credentials-storage";

export function buildPrototypeDefaultStaff(employeePinDefault = "1234") {
  return [
    {
      id: "ahmed",
      nameAr: "أحمد",
      nameEn: "Ahmed",
      mobile: "050 123 4567",
      active: true,
      storeIds: ["shami"],
      pin: employeePinDefault,
    },
    {
      id: "sara",
      nameAr: "سارة",
      nameEn: "Sara",
      mobile: "055 987 6543",
      active: true,
      storeIds: ["arz"],
      pin: employeePinDefault,
    },
  ];
}

const LOGGED_OUT_BOOT = {
  loggedIn: false,
  employee: false,
  loggedInEmployeeId: null,
  employeeBusinessId: "",
};

/**
 * @typedef {Object} PrototypeAuthBootOptions
 * @property {boolean} [bindsToServerAuth]
 * @property {boolean} [prototypeAccessMode]
 * @property {() => Record<string, unknown> | null} [readSavedSettings]
 * @property {Array<Record<string, unknown>>} [defaultStaff]
 * @property {(staffList: Array<Record<string, unknown>>) => Record<string, unknown>} [resolveAuthState]
 */

/**
 * @param {PrototypeAuthBootOptions} [options]
 */
export function readPrototypeAuthBoot({
  bindsToServerAuth = false,
  prototypeAccessMode = true,
  readSavedSettings = () => null,
  defaultStaff = buildPrototypeDefaultStaff(),
  resolveAuthState = resolveAuthStateFromSession,
} = {}) {
  if (!bindsToServerAuth || prototypeAccessMode) {
    return LOGGED_OUT_BOOT;
  }

  const settings = readSavedSettings();
  const staffList = settings?.staff || (bindsToServerAuth ? [] : defaultStaff);
  return resolveAuthState(staffList);
}
