import { readLocalStorageJson, safeSetLocalStorageItem } from "./prototype-storage";

const OWNER_CREDENTIALS_KEY = "taqfeelah_owner_credentials_v1";
const EMPLOYEE_CREDENTIALS_KEY = "taqfeelah_employee_credentials_v1";
const AUTH_SESSION_KEY = "taqfeelah_auth_session_v1";

export function readAuthSession() {
  const stored = readLocalStorageJson(AUTH_SESSION_KEY, null);
  if (!stored || typeof stored !== "object") return null;
  if (stored.role === "owner") return { role: "owner" };
  if (stored.role === "employee" && typeof stored.employeeId === "string" && stored.employeeId) {
    return { role: "employee", employeeId: stored.employeeId };
  }
  return null;
}

export function saveAuthSession(session) {
  if (session?.role === "owner") {
    return safeSetLocalStorageItem(AUTH_SESSION_KEY, JSON.stringify({ role: "owner", savedAt: new Date().toISOString() }));
  }
  if (session?.role === "employee" && session.employeeId) {
    return safeSetLocalStorageItem(
      AUTH_SESSION_KEY,
      JSON.stringify({ role: "employee", employeeId: session.employeeId, savedAt: new Date().toISOString() }),
    );
  }
  return false;
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** Restore login UI state after reload; clears session if employee no longer valid. */
export function resolveAuthStateFromSession(staffList) {
  const empty = { loggedIn: false, employee: false, loggedInEmployeeId: null, employeeBusinessId: "shami" };
  if (typeof window === "undefined") return empty;
  const session = readAuthSession();
  if (!session) return empty;
  if (session.role === "owner") {
    return { loggedIn: true, employee: false, loggedInEmployeeId: null, employeeBusinessId: "shami" };
  }
  const person = (staffList || []).find((item) => item.id === session.employeeId && item.active && !item.removed);
  if (!person) {
    clearAuthSession();
    return empty;
  }
  return {
    loggedIn: true,
    employee: true,
    loggedInEmployeeId: person.id,
    employeeBusinessId: person.storeIds?.[0] || "shami",
  };
}

export function readOwnerCredentials() {
  const stored = readLocalStorageJson(OWNER_CREDENTIALS_KEY, null);
  if (!stored || typeof stored !== "object") return null;
  const username = typeof stored.username === "string" ? stored.username : "";
  const password = typeof stored.password === "string" ? stored.password : "";
  if (!username && !password) return null;
  return { username, password };
}

export function saveOwnerCredentials({ username, password }) {
  return safeSetLocalStorageItem(
    OWNER_CREDENTIALS_KEY,
    JSON.stringify({ username: username || "", password: password || "", savedAt: new Date().toISOString() }),
  );
}

export function clearOwnerCredentials() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(OWNER_CREDENTIALS_KEY);
  } catch {
    /* ignore */
  }
}

export function readEmployeeCredentials() {
  const stored = readLocalStorageJson(EMPLOYEE_CREDENTIALS_KEY, null);
  if (!stored || typeof stored !== "object") return null;
  const employeeId = typeof stored.employeeId === "string" ? stored.employeeId : "";
  const pin = typeof stored.pin === "string" ? stored.pin : "";
  if (!employeeId && !pin) return null;
  return { employeeId, pin };
}

export function saveEmployeeCredentials({ employeeId, pin }) {
  return safeSetLocalStorageItem(
    EMPLOYEE_CREDENTIALS_KEY,
    JSON.stringify({ employeeId: employeeId || "", pin: pin || "", savedAt: new Date().toISOString() }),
  );
}

export function clearEmployeeCredentials() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(EMPLOYEE_CREDENTIALS_KEY);
  } catch {
    /* ignore */
  }
}
