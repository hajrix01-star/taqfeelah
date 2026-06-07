import { buildPrototypeApiAuthHeaders } from "@/core/client/prototype-api-auth-headers";

export async function parseApiErrorMessage(response, fallback) {
  try {
    const payload = await response.json();
    if (payload?.error?.message) return payload.error.message;
    return fallback;
  } catch {
    return fallback;
  }
}

export function buildPrototypeContextHeaders({
  organizationId = "",
  actorUserId = "",
  actorRole = "",
  contentType = "",
} = {}) {
  const headers = {
    ...buildPrototypeApiAuthHeaders({ organizationId, actorUserId, actorRole }),
  };
  if (contentType) {
    headers["content-type"] = contentType;
  }
  return headers;
}

/**
 * Low-level JSON fetch. Throws Error with API message or fallback on non-OK.
 */
async function buildFetchError(response, errorMessage, errorStyle) {
  if (errorStyle === "status") {
    return `${errorMessage}: ${response.status}`;
  }
  return parseApiErrorMessage(response, errorMessage);
}

export async function fetchApiJson(url, {
  method = "GET",
  headers = {},
  body,
  errorMessage = "API request failed.",
  errorStyle = "message",
  parseBody = true,
} = {}) {
  const init = {
    method,
    headers,
  };
  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(await buildFetchError(response, errorMessage, errorStyle));
  }
  if (!parseBody) return response;
  return response.json();
}

export async function fetchApiJsonWithPrototypeContext(url, {
  organizationId = "",
  actorUserId = "",
  actorRole = "",
  method = "GET",
  body,
  errorMessage = "API request failed.",
  errorStyle = "message",
  contentType = method === "GET" || method === "DELETE" ? "" : "application/json",
} = {}) {
  return fetchApiJson(url, {
    method,
    body,
    errorMessage,
    errorStyle,
    headers: buildPrototypeContextHeaders({
      organizationId,
      actorUserId,
      actorRole,
      contentType,
    }),
  });
}
