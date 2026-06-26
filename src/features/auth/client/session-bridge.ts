import {
  clearAuthSession,
  resolveAuthStateFromSession,
  saveAuthSession,
} from "@/features/auth/client/local-auth-session-storage";
import { clearOrganizationEntitlementsCache } from "@/features/billing/client/organization-entitlements-cache";
import { readRuntimeAuthBootState } from "@/features/auth/client/auth-gate/runtime-auth-boot-state";
import {
  changeOwnerPasswordViaApi,
  getSessionStatusViaApi,
  loginEmployeePhoneSessionViaApi,
  loginEmployeeSessionViaApi,
  loginOwnerPhoneSessionViaApi,
  loginOwnerSessionViaApi,
  logoutSessionViaApi,
} from "@/features/runtime-settings/client/runtime-session-and-settings-api-client";
import { readAuthServerSession } from "./auth-api-response";
import type {
  AuthServerSession,
  ChangeOwnerPasswordBridgeInput,
  EmployeeSessionBridgeInput,
  LogoutSessionBridgeInput,
  OwnerSessionBridgeInput,
} from "./auth-client-types";

export { resolveAuthStateFromSession };

export function readSessionBootState(
  options: Parameters<typeof readRuntimeAuthBootState>[0] = {},
) {
  return readRuntimeAuthBootState(options);
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
}: OwnerSessionBridgeInput = {}): Promise<AuthServerSession | null> {
  if (!useServerAuth) return null;
  if (phone) {
    return readAuthServerSession(await loginOwnerPhoneSessionViaApi({
      phone,
      password: password ?? "",
    }));
  }
  return readAuthServerSession(await loginOwnerSessionViaApi({
    username: username ?? "",
    password: password ?? "",
  }));
}

export async function loginEmployeeViaSessionBridge({
  employeeId,
  phone,
  pin,
  trustDevice,
  useServerAuth,
}: EmployeeSessionBridgeInput = {}): Promise<AuthServerSession | null> {
  if (!useServerAuth) return null;
  if (phone) {
    return readAuthServerSession(await loginEmployeePhoneSessionViaApi({ phone, pin, trustDevice }));
  }
  return readAuthServerSession(await loginEmployeeSessionViaApi({
    employeeId: employeeId ?? "",
    pin: pin ?? "",
  }));
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
