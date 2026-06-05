async function parseErrorMessage(response, fallback) {
  try {
    const payload = await response.json();
    if (payload?.error?.message) return payload.error.message;
    return fallback;
  } catch {
    return fallback;
  }
}

export async function loginOwnerSessionViaApi({ username, password }) {
  const response = await fetch("/api/v1/auth/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      mode: "owner_password",
      username,
      password,
    }),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Owner login failed."));
  }
  return response.json();
}

export async function getSessionStatusViaApi() {
  const response = await fetch("/api/v1/auth/session", {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Failed to resolve session."));
  }
  return response.json();
}

export async function loginEmployeeSessionViaApi({ employeeId, pin }) {
  const response = await fetch("/api/v1/auth/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      mode: "employee_pin",
      employeeId,
      pin,
    }),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Employee login failed."));
  }
  return response.json();
}

export async function logoutSessionViaApi() {
  const response = await fetch("/api/v1/auth/session", {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Logout failed."));
  }
  return response.json();
}

export async function fetchRuntimeSettingsViaApi() {
  const response = await fetch("/api/v1/runtime/settings", {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Failed to load runtime settings."));
  }
  return response.json();
}

export async function fetchEmployeeLoginRosterViaApi() {
  const response = await fetch("/api/v1/auth/employee-roster", {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Failed to load employee roster."));
  }
  return response.json();
}

export async function saveRuntimeSettingsViaApi({ settings, reason = "" }) {
  const response = await fetch("/api/v1/runtime/settings", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      settings,
      reason,
    }),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Failed to save runtime settings."));
  }
  return response.json();
}
