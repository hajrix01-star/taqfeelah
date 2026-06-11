import { AppError } from "@/core/errors/app-error";
import { getPublicErrorPayload, normalizeError } from "@/core/errors/normalize-error";
import { logger } from "@/core/logger";

export type FailContext = {
  requestId?: string;
};

export function ok<T>(data: T, init?: ResponseInit) {
  return Response.json(data, {
    status: 200,
    ...init,
  });
}

export function fail(error: unknown, context?: FailContext): Response {
  const normalized = normalizeError(error);

  if (!(error instanceof AppError) && normalized.code === "INTERNAL_ERROR") {
    logger.error(
      {
        err: error,
        requestId: context?.requestId,
        errorCode: normalized.code,
      },
      "Unhandled API error",
    );
  }

  return Response.json(
    {
      error: getPublicErrorPayload(normalized),
    },
    { status: normalized.status },
  );
}

export function failRequest(error: unknown, request: Request): Response {
  const requestId = request.headers.get("x-request-id")?.trim();
  return fail(error, requestId ? { requestId } : undefined);
}
