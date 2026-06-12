import { fetchApiJson, fetchApiJsonWithPrototypeContext } from "@/core/client/api-fetch";

export async function loginOwnerSessionViaApi({ username, password }) {
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

export async function getSessionStatusViaApi() {
  return fetchApiJson("/api/v1/auth/session", {
    errorMessage: "Failed to resolve session.",
  });
}

export async function loginEmployeeSessionViaApi({ employeeId, pin }) {
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

export async function logoutSessionViaApi() {
  return fetchApiJson("/api/v1/auth/session", {
    method: "DELETE",
    errorMessage: "Logout failed.",
  });
}

export async function changeOwnerPasswordViaApi({ currentPassword, newPassword }) {
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

const runtimeSettingsInflight = new Map();

function buildRuntimeSettingsAuthKey({
  organizationId = "",
  actorUserId = "",
  actorRole = "",
} = {}) {
  return `${organizationId}|${actorUserId}|${actorRole}`;
}

async function fetchRuntimeSettingsViaApiImpl({
  organizationId,
  actorUserId,
  actorRole,
} = {}) {
  return fetchApiJsonWithPrototypeContext("/api/v1/runtime/settings", {
    organizationId,
    actorUserId,
    actorRole,
    errorMessage: "Failed to load runtime settings.",
  });
}

export async function fetchRuntimeSettingsViaApi({
  organizationId,
  actorUserId,
  actorRole,
} = {}) {
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

export async function fetchEmployeeLoginRosterViaApi() {
  return fetchApiJson("/api/v1/auth/employee-roster", {
    errorMessage: "Failed to load employee roster.",
  });
}

export async function saveRuntimeSettingsViaApi({
  settings,
  reason = "",
  organizationId,
  actorUserId,
  actorRole,
} = {}) {
  return fetchApiJsonWithPrototypeContext("/api/v1/runtime/settings", {
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
