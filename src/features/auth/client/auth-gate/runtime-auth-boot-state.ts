import type { AuthStaffMember } from "@/features/auth/client/auth-client-types";
import {
  resolveAuthStateFromSession,
  type AuthBootState,
} from "@/features/auth/client/local-auth-session-storage";

export type RuntimeAuthBootOptions = {
  bindsToServerAuth?: boolean;
  readSavedSettings?: () => Record<string, unknown> | null;
  defaultStaff?: AuthStaffMember[];
  resolveAuthState?: (staffList: AuthStaffMember[]) => AuthBootState;
};

const LOGGED_OUT_BOOT: AuthBootState = {
  loggedIn: false,
  employee: false,
  loggedInEmployeeId: null,
  employeeBusinessId: "",
};

export function readRuntimeAuthBootState({
  bindsToServerAuth = false,
  readSavedSettings = () => null,
  defaultStaff = [],
  resolveAuthState = resolveAuthStateFromSession,
}: RuntimeAuthBootOptions = {}): AuthBootState {
  if (!bindsToServerAuth) {
    return LOGGED_OUT_BOOT;
  }

  const settings = readSavedSettings();
  const staffList = (settings?.staff as AuthStaffMember[] | undefined) || [];
  return resolveAuthState(staffList.length ? staffList : defaultStaff);
}
