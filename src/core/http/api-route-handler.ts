import { resolveRequestContext, type RequestContext } from "@/core/auth/request-context";
import { assertProductionRuntimeEnv, isServerProductionMode, readEnv } from "@/core/config/env";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import { fail, ok, type FailContext } from "@/core/http/api-response";

type RouteHandlerContext<TParams = Record<string, string>> = {
  params: Promise<TParams>;
};

export type ApiRouteContext<TParams = Record<string, string>> = {
  request: Request;
  params: TParams;
  searchParams: URLSearchParams;
};

type AuthedApiRouteContext<TParams = Record<string, string>> = ApiRouteContext<TParams> & {
  auth: RequestContext & {
    userId: string;
    role: NonNullable<RequestContext["role"]>;
  };
};

export type ApiRouteResult<T> = T | Response | { data: T; init?: ResponseInit };

type ApiRouteHandler<TParams extends Record<string, string>, TResult> = (
  context: ApiRouteContext<TParams>,
) => Promise<ApiRouteResult<TResult>> | ApiRouteResult<TResult>;

type AuthedApiRouteHandler<TParams extends Record<string, string>, TResult> = (
  context: AuthedApiRouteContext<TParams>,
) => Promise<ApiRouteResult<TResult>> | ApiRouteResult<TResult>;

function isResponse(value: unknown): value is Response {
  return value instanceof Response;
}

function isDataResult<T>(value: ApiRouteResult<T>): value is { data: T; init?: ResponseInit } {
  return (
    typeof value === "object"
    && value !== null
    && "data" in value
    && !isResponse(value)
  );
}

function toApiResponse<T>(result: ApiRouteResult<T>): Response {
  if (isResponse(result)) return result;
  if (isDataResult(result)) return ok(result.data, result.init);
  return ok(result);
}

function failRoute(error: unknown, request: Request): Response {
  const requestId = request.headers.get("x-request-id")?.trim();
  const context: FailContext | undefined = requestId ? { requestId } : undefined;
  return fail(error, context);
}

export function requireDatabaseEnv() {
  const env = readEnv();
  if (isServerProductionMode(env)) {
    assertProductionRuntimeEnv(env);
  }
  if (!env.DATABASE_URL) {
    throw new ServiceUnavailableError("DATABASE_URL is not configured.");
  }
  return env;
}

export async function readJsonBody<T = Awaited<ReturnType<Request["json"]>>>(request: Request): Promise<T> {
  return request.json() as Promise<T>;
}

export function parseEnumQuery<T extends string>(
  searchParams: URLSearchParams,
  name: string,
  allowed: readonly T[],
  fallback: T,
): T {
  const value = searchParams.get(name) || fallback;
  if (!allowed.includes(value as T)) {
    throw new ValidationError(`Query param '${name}' must be one of: ${allowed.join(", ")}.`);
  }
  return value as T;
}

export function parsePositiveIntQuery(
  searchParams: URLSearchParams,
  name: string,
  options: { max?: number } = {},
): number | undefined {
  const raw = searchParams.get(name);
  if (!raw) return undefined;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ValidationError(`Query param '${name}' must be a positive integer.`);
  }
  if (typeof options.max === "number" && parsed > options.max) {
    throw new ValidationError(`Query param '${name}' must be less than or equal to ${options.max}.`);
  }
  return parsed;
}

export function withApiRoute<TParams extends Record<string, string> = Record<string, string>, TResult = unknown>(
  handler: ApiRouteHandler<TParams, TResult>,
) {
  return async function apiRoute(request: Request, context: RouteHandlerContext<TParams>) {
    try {
      requireDatabaseEnv();
      const routeContext = context as RouteHandlerContext<TParams> | undefined;
      const params = routeContext?.params ? await routeContext.params : ({} as TParams);
      const { searchParams } = new URL(request.url);
      return toApiResponse(await handler({ request, params, searchParams }));
    } catch (error) {
      return failRoute(error, request);
    }
  };
}

export function withApiRouteNoParams<TResult = unknown>(
  handler: ApiRouteHandler<Record<string, string>, TResult>,
) {
  return async function apiRoute(request: Request) {
    try {
      requireDatabaseEnv();
      const { searchParams } = new URL(request.url);
      return toApiResponse(await handler({ request, params: {}, searchParams }));
    } catch (error) {
      return failRoute(error, request);
    }
  };
}

export function withPublicApiRouteNoParams<TResult = unknown>(
  handler: ApiRouteHandler<Record<string, string>, TResult>,
) {
  return async function apiRoute(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      return toApiResponse(await handler({ request, params: {}, searchParams }));
    } catch (error) {
      return failRoute(error, request);
    }
  };
}

export function withAuthedApiRoute<TParams extends Record<string, string> = Record<string, string>, TResult = unknown>(
  handler: AuthedApiRouteHandler<TParams, TResult>,
) {
  return withApiRoute<TParams, TResult>((context) => {
    const requestContext = resolveRequestContext(context.request, { requireUser: true });
    return handler({
      ...context,
      auth: {
        ...requestContext,
        userId: requestContext.userId!,
        role: requestContext.role!,
      },
    });
  });
}

export function withAuthedApiRouteNoParams<TResult = unknown>(
  handler: AuthedApiRouteHandler<Record<string, string>, TResult>,
) {
  return withApiRouteNoParams<TResult>((context) => {
    const requestContext = resolveRequestContext(context.request, { requireUser: true });
    return handler({
      ...context,
      auth: {
        ...requestContext,
        userId: requestContext.userId!,
        role: requestContext.role!,
      },
    });
  });
}
