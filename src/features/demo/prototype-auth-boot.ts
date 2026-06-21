import type { AuthStaffMember } from "@/features/auth/client/auth-client-types";
import { resolveAuthStateFromSession } from "./login-credentials-storage";
import type { AuthBootState, PrototypeAuthBootOptions } from "@/features/demo/demo-types";

/** @deprecated Local demo staff — kept for non-DB prototype app mode only. */
export function buildPrototypeDefaultStaff(employeePinDefault = "1234"): AuthStaffMember[] {
  return [
    {
      id: "ahmed",
      nameAr: "أحمد",
      nameEn: "Ahmed",
      active: true,
      storeIds: ["shami"],
      pin: employeePinDefault,
    },
    {
      id: "sara",
      nameAr: "سارة",
      nameEn: "Sara",
      active: true,
      storeIds: ["arz"],
      pin: employeePinDefault,
    },
  ];
}

const LOGGED_OUT_BOOT: AuthBootState = {
  loggedIn: false,
  employee: false,
  loggedInEmployeeId: null,
  employeeBusinessId: "",
};

export function readPrototypeAuthBoot({
  bindsToServerAuth = false,
  readSavedSettings = () => null,
  defaultStaff = buildPrototypeDefaultStaff(),
  resolveAuthState = resolveAuthStateFromSession,
}: PrototypeAuthBootOptions = {}): AuthBootState {
  if (!bindsToServerAuth) {
    return LOGGED_OUT_BOOT;
  }

  const settings = readSavedSettings();
  const staffList = (settings?.staff as AuthStaffMember[] | undefined) || [];
  return resolveAuthState(staffList.length ? staffList : defaultStaff);
}
