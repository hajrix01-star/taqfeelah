import { buildRuntimeApiAuthHeaders } from "@/core/client/runtime-api-auth-headers";

export async function parseApiErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = await response.json();
    if (payload?.error?.message) return payload.error.message;
    return fallback;
  } catch {
    return fallback;
  }
}

export function buildRuntimeContextHeaders({
  organizationId = "",
  actorUserId = "",
  actorRole = "",
  contentType = "",
}: {
  organizationId?: string;
  actorUserId?: string;
  actorRole?: string;
  contentType?: string;
} = {}): Record<string, string> {
  const headers: Record<string, string> = {
    ...buildRuntimeApiAuthHeaders({ organizationId, actorUserId, actorRole }),
  };
  if (contentType) {
    headers["content-type"] = contentType;
  }
  return headers;
}

async function buildFetchError(
  response: Response,
  errorMessage: string,
  errorStyle: string,
): Promise<string> {
  if (errorStyle === "status") {
    return `${errorMessage}: ${response.status}`;
  }
  return parseApiErrorMessage(response, errorMessage);
}

export type FetchApiJsonOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  credentials?: RequestCredentials;
  errorMessage?: string;
  errorStyle?: string;
  parseBody?: boolean;
};

/** Low-level JSON fetch. Throws Error with API message or fallback on non-OK. */
export async function fetchApiJson(
  url: string,
  {
    method = "GET",
    headers = {},
    body,
    errorMessage = "API request failed.",
    errorStyle = "message",
    parseBody = true,
  }: FetchApiJsonOptions = {},
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional open API boundary; callers narrow
): Promise<any> {
  const init: RequestInit = {
    method,
    headers,
  };
  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const response = await fetch(url, { ...init, credentials: "include" });
  if (!response.ok) {
    throw new Error(await buildFetchError(response, errorMessage, errorStyle));
  }
  if (!parseBody) return response;
  return response.json();
}

export type fetchApiJsonWithRuntimeContextOptions = {
  organizationId?: string;
  actorUserId?: string;
  actorRole?: string;
  method?: string;
  body?: unknown;
  errorMessage?: string;
  errorStyle?: string;
  contentType?: string;
};

export async function fetchApiJsonWithRuntimeContext(
  url: string,
  {
    organizationId = "",
    actorUserId = "",
    actorRole = "",
    method = "GET",
    body,
    errorMessage = "API request failed.",
    errorStyle = "message",
    contentType = method === "GET" || method === "DELETE" ? "" : "application/json",
  }: fetchApiJsonWithRuntimeContextOptions = {},
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentional open API boundary; callers narrow
): Promise<any> {
  return fetchApiJson(url, {
    method,
    body,
    errorMessage,
    errorStyle,
    headers: buildRuntimeContextHeaders({
      organizationId,
      actorUserId,
      actorRole,
      contentType,
    }),
  });
}
