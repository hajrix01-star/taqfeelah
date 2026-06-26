import { fetchApiJson, fetchApiJsonWithRuntimeContext } from "@/core/client/api-fetch";
import type { RuntimeSettingsAuth } from "@/features/runtime-settings/client/runtime-settings-client-types";

export async function loginOwnerSessionViaApi({
  username,
  password,
}: {
  username: string;
  password: string;
}): Promise<unknown> {
  return fetchApiJson("/api/v1/auth/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: {
      mode: "owner_password",
      username,
      password,
    },
    errorMessage: "Owner login failed.",
  });
}

export async function loginOwnerPhoneSessionViaApi({
  phone,
  password,
}: {
  phone: string;
  password: string;
}): Promise<unknown> {
  return fetchApiJson("/api/v1/auth/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: {
      mode: "owner_phone_password",
      phone,
      password,
    },
    errorMessage: "Owner login failed.",
  });
}

export async function getSessionStatusViaApi(): Promise<unknown> {
  return fetchApiJson("/api/v1/auth/session", {
    errorMessage: "Failed to resolve session.",
  });
}

export async function loginEmployeeSessionViaApi({
  employeeId,
  pin,
}: {
  employeeId: string;
  pin: string;
}): Promise<unknown> {
  return fetchApiJson("/api/v1/auth/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: {
      mode: "employee_pin",
      employeeId,
      pin,
    },
    errorMessage: "Employee login failed.",
  });
}

export async function loginEmployeePhoneSessionViaApi({
  phone,
  pin,
  trustDevice = true,
}: {
  phone: string;
  pin?: string;
  trustDevice?: boolean;
}): Promise<unknown> {
  return fetchApiJson("/api/v1/auth/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: {
      mode: "employee_phone_pin",
      phone,
      pin: pin || undefined,
      trustDevice,
    },
    errorMessage: "Employee login failed.",
  });
}

export async function logoutSessionViaApi(): Promise<unknown> {
  return fetchApiJson("/api/v1/auth/session", {
    method: "DELETE",
    errorMessage: "Logout failed.",
  });
}

export async function requestOwnerPasswordResetViaApi({ email }: { email: string }): Promise<unknown> {
  return fetchApiJson("/api/v1/auth/password-reset/request", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: { email },
    errorMessage: "Password reset request failed.",
  });
}

export async function validateOwnerPasswordResetTokenViaApi(token: string): Promise<unknown> {
  const search = new URLSearchParams({ token });
  return fetchApiJson(`/api/v1/auth/password-reset/validate?${search.toString()}`, {
    errorMessage: "Password reset token validation failed.",
  });
}

export async function confirmOwnerPasswordResetViaApi({
  token,
  newPassword,
  confirmPassword,
}: {
  token: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<unknown> {
  return fetchApiJson("/api/v1/auth/password-reset/confirm", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: { token, newPassword, confirmPassword },
    errorMessage: "Password reset confirmation failed.",
  });
}

export async function changeOwnerPasswordViaApi({
  currentPassword,
  newPassword,
}: {
  currentPassword: string;
  newPassword: string;
}): Promise<unknown> {
  return fetchApiJson("/api/v1/auth/change-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: {
      currentPassword,
      newPassword,
    },
    errorMessage: "Password change failed.",
  });
}

const runtimeSettingsInflight = new Map<string, Promise<Record<string, unknown>>>();

function buildRuntimeSettingsAuthKey({
  organizationId = "",
  actorUserId = "",
  actorRole = "",
}: RuntimeSettingsAuth = {}): string {
  return `${organizationId}|${actorUserId}|${actorRole}`;
}

async function fetchRuntimeSettingsViaApiImpl({
  organizationId = "",
  actorUserId = "",
  actorRole = "",
}: RuntimeSettingsAuth = {}): Promise<Record<string, unknown>> {
  return fetchApiJsonWithRuntimeContext("/api/v1/runtime/settings", {
    organizationId,
    actorUserId,
    actorRole,
    errorMessage: "Failed to load runtime settings.",
  }) as Promise<Record<string, unknown>>;
}

export async function fetchRuntimeSettingsViaApi({
  organizationId = "",
  actorUserId = "",
  actorRole = "",
}: RuntimeSettingsAuth = {}): Promise<Record<string, unknown>> {
  const authKey = buildRuntimeSettingsAuthKey({ organizationId, actorUserId, actorRole });
  const inflight = runtimeSettingsInflight.get(authKey);
  if (inflight) return inflight;

  const promise = fetchRuntimeSettingsViaApiImpl({
    organizationId,
    actorUserId,
    actorRole,
  });
  runtimeSettingsInflight.set(authKey, promise);
  try {
    return await promise;
  } finally {
    runtimeSettingsInflight.delete(authKey);
  }
}

export async function fetchEmployeeLoginRosterViaApi(): Promise<unknown> {
  return fetchApiJson("/api/v1/auth/employee-roster", {
    errorMessage: "Failed to load employee roster.",
  });
}

export async function saveRuntimeSettingsViaApi({
  settings,
  reason = "",
  organizationId = "",
  actorUserId = "",
  actorRole = "",
}: RuntimeSettingsAuth & {
  settings?: Record<string, unknown>;
  reason?: string;
} = {}): Promise<unknown> {
  return fetchApiJsonWithRuntimeContext("/api/v1/runtime/settings", {
    organizationId,
    actorUserId,
    actorRole,
    method: "PUT",
    body: {
      settings,
      reason,
    },
    errorMessage: "Failed to save runtime settings.",
  });
}
