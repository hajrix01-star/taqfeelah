import { AppError } from "@/core/errors/app-error";
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
  if (error instanceof AppError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status },
    );
  }

  logger.error(
    {
      err: error,
      requestId: context?.requestId,
    },
    "Unhandled API error",
  );

  return Response.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Unexpected server error.",
      },
    },
    { status: 500 },
  );
}

export function failRequest(error: unknown, request: Request): Response {
  const requestId = request.headers.get("x-request-id")?.trim();
  return fail(error, requestId ? { requestId } : undefined);
}
