import {
  clearAuthSession,
  resolveAuthStateFromSession,
  saveAuthSession,
} from "@/features/demo/login-credentials-storage";
import { readPrototypeAuthBoot } from "@/features/demo/prototype-auth-boot";
import {
  changeOwnerPasswordViaApi,
  getSessionStatusViaApi,
  loginEmployeeSessionViaApi,
  loginOwnerSessionViaApi,
  logoutSessionViaApi,
} from "@/features/runtime-settings/client/runtime-session-and-settings-api-client";

export { resolveAuthStateFromSession };

/**
 * @param {import("@/features/demo/prototype-auth-boot").PrototypeAuthBootOptions} [options]
 */
export function readSessionBootState(options = {}) {
  return readPrototypeAuthBoot(options);
}

export function persistLocalOwnerSession(prototypeAccessMode) {
  if (!prototypeAccessMode) {
    saveAuthSession({ role: "owner" });
  }
}

export function persistLocalEmployeeSession({ prototypeAccessMode, employeeId }) {
  if (!prototypeAccessMode && employeeId) {
    saveAuthSession({ role: "employee", employeeId });
  }
}

export function clearAllLocalSessions() {
  clearAuthSession();
}

export async function fetchServerSessionStatus() {
  return getSessionStatusViaApi();
}

export async function loginOwnerViaSessionBridge({ username, password, useServerAuth }) {
  if (!useServerAuth) return null;
  return loginOwnerSessionViaApi({ username, password });
}

export async function loginEmployeeViaSessionBridge({ employeeId, pin, useServerAuth }) {
  if (!useServerAuth) return null;
  return loginEmployeeSessionViaApi({ employeeId, pin });
}

export async function changeOwnerPasswordViaSessionBridge({ currentPassword, newPassword, useServerAuth }) {
  if (!useServerAuth) return null;
  return changeOwnerPasswordViaApi({ currentPassword, newPassword });
}

export async function logoutViaSessionBridge({ useServerAuth }) {
  if (useServerAuth) {
    await logoutSessionViaApi();
  }
  clearAuthSession();
}
