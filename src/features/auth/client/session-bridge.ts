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
import type {
  ChangeOwnerPasswordBridgeInput,
  EmployeeSessionBridgeInput,
  LogoutSessionBridgeInput,
  OwnerSessionBridgeInput,
} from "./auth-client-types";

export { resolveAuthStateFromSession };

export function readSessionBootState(
  options: Parameters<typeof readPrototypeAuthBoot>[0] = {},
) {
  return readPrototypeAuthBoot(options);
}

export function persistLocalOwnerSession() {
  saveAuthSession({ role: "owner" });
}

export function persistLocalEmployeeSession({ employeeId }: { employeeId: string }) {
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

export async function loginOwnerViaSessionBridge({
  username,
  password,
  phone,
  useServerAuth,
}: OwnerSessionBridgeInput = {}) {
  if (!useServerAuth) return null;
  if (phone) {
    return loginOwnerPhoneSessionViaApi({ phone, password });
  }
  return loginOwnerSessionViaApi({ username, password });
}

export async function loginEmployeeViaSessionBridge({
  employeeId,
  phone,
  pin,
  trustDevice,
  useServerAuth,
}: EmployeeSessionBridgeInput = {}) {
  if (!useServerAuth) return null;
  if (phone) {
    return loginEmployeePhoneSessionViaApi({ phone, pin, trustDevice });
  }
  return loginEmployeeSessionViaApi({ employeeId, pin });
}

export async function changeOwnerPasswordViaSessionBridge({
  currentPassword,
  newPassword,
  useServerAuth,
}: ChangeOwnerPasswordBridgeInput) {
  if (!useServerAuth) return null;
  return changeOwnerPasswordViaApi({ currentPassword, newPassword });
}

export async function logoutViaSessionBridge({ useServerAuth }: LogoutSessionBridgeInput) {
  if (useServerAuth) {
    await logoutSessionViaApi();
  }
  clearAuthSession();
  clearOrganizationEntitlementsCache();
}
