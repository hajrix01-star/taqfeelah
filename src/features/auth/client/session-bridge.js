import {
  clearAuthSession,
  resolveAuthStateFromSession,
  saveAuthSession,
} from "@/features/demo/login-credentials-storage";
import { clearOrganizationEntitlementsCache } from "@/features/billing/client/organization-entitlements-cache";
import { readPrototypeAuthBoot } from "@/features/demo/prototype-auth-boot";
import {
  changeOwnerPasswordViaApi,
  getSessionStatusViaApi,
  loginEmployeePhoneSessionViaApi,
  loginEmployeeSessionViaApi,
  loginOwnerPhoneSessionViaApi,
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

export function persistLocalOwnerSession() {
  saveAuthSession({ role: "owner" });
}

export function persistLocalEmployeeSession({ employeeId }) {
  if (employeeId) {
    saveAuthSession({ role: "employee", employeeId });
  }
}

export function clearAllLocalSessions() {
  clearAuthSession();
  clearOrganizationEntitlementsCache();
}

export async function fetchServerSessionStatus() {
  return getSessionStatusViaApi();
}

/**
 * @param {{ username?: string, password?: string, phone?: string, useServerAuth?: boolean }} input
 */
export async function loginOwnerViaSessionBridge({ username, password, phone, useServerAuth } = {}) {
  if (!useServerAuth) return null;
  if (phone) {
    return loginOwnerPhoneSessionViaApi({ phone, password });
  }
  return loginOwnerSessionViaApi({ username, password });
}

/**
 * @param {{ employeeId?: string, phone?: string, pin?: string, trustDevice?: boolean, useServerAuth?: boolean }} input
 */
export async function loginEmployeeViaSessionBridge({ employeeId, phone, pin, trustDevice, useServerAuth } = {}) {
  if (!useServerAuth) return null;
  if (phone) {
    return loginEmployeePhoneSessionViaApi({ phone, pin, trustDevice });
  }
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
  clearOrganizationEntitlementsCache();
}
