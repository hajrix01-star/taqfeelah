import { ok, fail } from "@/core/http/api-response";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { listStoreCloseouts } from "@/features/closeouts/server/list-store-closeouts";
import { resolveSubmitCloseoutId } from "@/features/closeouts/server/resolve-submit-closeout-id";
import { normalizeCloseoutSubmitMode } from "@/features/closeouts/closeout-submit-mode";
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
    const mode = normalizeCloseoutSubmitMode(body?.mode);
    const closeoutId = resolveSubmitCloseoutId(body?.closeoutId);

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
      attachments: Array.isArray(body?.attachments) ? body.attachments : [],
      note: typeof body?.note === "string" ? body.note : undefined,
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

    const limitRaw = searchParams.get("limit");
    const parsedLimit = limitRaw ? Number(limitRaw) : undefined;
    if (typeof parsedLimit === "number" && (!Number.isInteger(parsedLimit) || parsedLimit <= 0)) {
      throw new ValidationError("Query param 'limit' must be a positive integer.");
    }

    const cursor = searchParams.get("cursor") || undefined;
    const paginated = searchParams.get("paginated") === "1" || Boolean(cursor);

    const result = await listStoreCloseouts({
      organizationId: requestContext.organizationId,
      storeId: params.storeId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      dateFrom,
      dateTo,
      limit: parsedLimit ?? (paginated ? 50 : 200),
      cursor,
      paginated,
    });

    if (paginated) {
      return ok(result);
    }

    return ok(result.items);
  } catch (error) {
    return fail(error);
  }
}
