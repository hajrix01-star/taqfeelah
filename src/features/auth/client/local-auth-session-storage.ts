import { readLocalStorageJson, safeSetLocalStorageItem } from "@/core/client/safe-local-storage";
import { isProductionAppMode } from "@/core/config/app-mode";
import type { AuthStaffMember } from "@/features/auth/client/auth-client-types";

export type AuthSessionOwner = {
  role: "owner";
};

export type AuthSessionEmployee = {
  role: "employee";
  employeeId: string;
};

export type AuthSession = AuthSessionOwner | AuthSessionEmployee;

export type AuthBootState = {
  loggedIn: boolean;
  employee: boolean;
  loggedInEmployeeId: string | null;
  employeeBusinessId: string;
};

const AUTH_SESSION_KEY = "taqfeelah_auth_session_v1";

type StoredAuthSession = {
  role?: string;
  employeeId?: string;
};

export function readAuthSession(): AuthSession | null {
  if (isProductionAppMode()) return null;
  const stored = readLocalStorageJson<StoredAuthSession | null>(AUTH_SESSION_KEY, null);
  if (!stored || typeof stored !== "object") return null;
  if (stored.role === "owner") return { role: "owner" };
  if (stored.role === "employee" && typeof stored.employeeId === "string" && stored.employeeId) {
    return { role: "employee", employeeId: stored.employeeId };
  }
  return null;
}
export function saveAuthSession(session: AuthSession | null | undefined): boolean {
  if (isProductionAppMode()) return false;
  if (session?.role === "owner") {
    return safeSetLocalStorageItem(AUTH_SESSION_KEY, JSON.stringify({ role: "owner", savedAt: new Date().toISOString() })).ok;
  }
  if (session?.role === "employee" && session.employeeId) {
    return safeSetLocalStorageItem(
      AUTH_SESSION_KEY,
      JSON.stringify({ role: "employee", employeeId: session.employeeId, savedAt: new Date().toISOString() }),
    ).ok;
  }
  return false;
}

export function clearAuthSession(): void {
  if (isProductionAppMode()) return;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** Restore login UI state after reload; clears session if employee no longer valid. */
export function resolveAuthStateFromSession(staffList: AuthStaffMember[] = []): AuthBootState {
  const defaultStoreId = staffList.find((item) => item.active && !item.removed)?.storeIds?.[0] || "";
  const empty: AuthBootState = {
    loggedIn: false,
    employee: false,
    loggedInEmployeeId: null,
    employeeBusinessId: defaultStoreId,
  };
  if (typeof window === "undefined") return empty;
  const session = readAuthSession();
  if (!session) return empty;
  if (session.role === "owner") {
    return { loggedIn: true, employee: false, loggedInEmployeeId: null, employeeBusinessId: "shami" };
  }
  const person = staffList.find((item) => item.id === session.employeeId && item.active && !item.removed);
  if (!person) {
    clearAuthSession();
    return empty;
  }
  return {
    loggedIn: true,
    employee: true,
    loggedInEmployeeId: person.id || null,
    employeeBusinessId: person.storeIds?.[0] || "shami",
  };
}
