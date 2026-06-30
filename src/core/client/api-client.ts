export type ApiClientErrorFactory = (payload: unknown, status: number, response: Response) => Error | Promise<Error>;

export type ApiClientRequestOptions = {
  method?: string;
  headers?: HeadersInit;
  body?: unknown;
  credentials?: RequestCredentials;
  parseBody?: boolean;
  unwrapData?: boolean;
  errorFactory?: ApiClientErrorFactory;
};

function normalizeBody(body: unknown): BodyInit | null | undefined {
  if (body === undefined || body === null) return body as null | undefined;
  if (typeof body === "string") return body;
  if (
    body instanceof Blob
    || body instanceof FormData
    || body instanceof URLSearchParams
    || body instanceof ArrayBuffer
  ) {
    return body;
  }
  return JSON.stringify(body);
}

async function readJsonPayload(response: Response): Promise<unknown> {
  return response.json().catch(() => ({}));
}

export async function apiClientRequest<T = unknown>(
  path: string,
  {
    method = "GET",
    headers,
    body,
    credentials = "include",
    parseBody = true,
    unwrapData = false,
    errorFactory,
  }: ApiClientRequestOptions = {},
): Promise<T> {
  const init: RequestInit = {
    method,
    headers,
    credentials,
  };
  if (body !== undefined) {
    init.body = normalizeBody(body);
  }

  const response = await fetch(path, init);

  if (!response.ok) {
    const payload = await readJsonPayload(response);
    if (errorFactory) {
      throw await errorFactory(payload, response.status, response);
    }
    throw new Error(`API request failed: ${response.status}`);
  }

  if (!parseBody) return response as T;

  const payload = await readJsonPayload(response);
  if (unwrapData && payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data?: T }).data as T;
  }
  return payload as T;
}

export const apiClient = {
  request: apiClientRequest,
  get: <T = unknown>(path: string, options: Omit<ApiClientRequestOptions, "method" | "body"> = {}) =>
    apiClientRequest<T>(path, { ...options, method: "GET" }),
  post: <T = unknown>(path: string, body?: unknown, options: Omit<ApiClientRequestOptions, "method" | "body"> = {}) =>
    apiClientRequest<T>(path, { ...options, method: "POST", body }),
  patch: <T = unknown>(path: string, body?: unknown, options: Omit<ApiClientRequestOptions, "method" | "body"> = {}) =>
    apiClientRequest<T>(path, { ...options, method: "PATCH", body }),
  delete: <T = unknown>(path: string, options: Omit<ApiClientRequestOptions, "method" | "body"> = {}) =>
    apiClientRequest<T>(path, { ...options, method: "DELETE" }),
};
