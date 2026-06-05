import { clearAuthSession, resolveAuthStateFromSession, saveAuthSession } from "@/features/demo/login-credentials-storage";

function normalizeAuthBoot(state, fallbackBusinessId = "shami") {
  return {
    loggedIn: Boolean(state?.loggedIn),
    employee: Boolean(state?.employee),
    loggedInEmployeeId: state?.loggedInEmployeeId || null,
    employeeBusinessId: state?.employeeBusinessId || fallbackBusinessId,
  };
}

export function readPrototypeAuthBoot(staffList, fallbackBusinessId = "shami") {
  const resolved = resolveAuthStateFromSession(staffList);
  return normalizeAuthBoot(resolved, fallbackBusinessId);
}

export function writePrototypeAuthBootOwner() {
  return saveAuthSession({ role: "owner" });
}

export function writePrototypeAuthBootEmployee(employeeId) {
  if (!employeeId) return false;
  return saveAuthSession({ role: "employee", employeeId });
}

export function clearPrototypeAuthBoot() {
  clearAuthSession();
}
