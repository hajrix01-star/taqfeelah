import { ok, fail } from "@/core/http/api-response";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { listStoreCloseouts } from "@/features/closeouts/server/list-store-closeouts";
import { submitStoreCloseout } from "@/features/closeouts/server/submit-store-closeout";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ storeId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const params = await context.params;
    const requestContext = resolveRequestContext(request, { requireUser: true });
    const body = await request.json();
    const mode = body?.mode === "resubmit" ? "resubmit" : "submit";
    const closeoutId = typeof body?.closeoutId === "string" && body.closeoutId.trim()
      ? body.closeoutId.trim()
      : `closeout-${params.storeId}-${body?.date || ""}`;

    if (typeof body?.date !== "string" || !body.date) {
      throw new ValidationError("Body field 'date' is required.");
    }

    const result = await submitStoreCloseout({
      organizationId: requestContext.organizationId,
      storeId: params.storeId,
      date: body.date,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      closeoutId,
      mode,
      salesChannels: Array.isArray(body?.salesChannels) ? body.salesChannels : [],
      outflows: Array.isArray(body?.outflows) ? body.outflows : [],
      note: typeof body?.note === "string" ? body.note : undefined,
      autoReview: body?.autoReview === true,
      requireReview: body?.requireReview === true,
    });

    return ok(result, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const params = await context.params;
    const requestContext = resolveRequestContext(request, { requireUser: true });
    const { searchParams } = new URL(request.url);

    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;

    const result = await listStoreCloseouts({
      organizationId: requestContext.organizationId,
      storeId: params.storeId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      dateFrom,
      dateTo,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
