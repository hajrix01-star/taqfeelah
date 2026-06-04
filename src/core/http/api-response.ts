import { AppError } from "@/core/errors/app-error";

export function ok<T>(data: T, init?: ResponseInit) {
  return Response.json(data, {
    status: 200,
    ...init,
  });
}

export function fail(error: unknown): Response {
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

  console.error(error);
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
