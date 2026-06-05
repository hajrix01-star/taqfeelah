import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { createStoreEntry } from "@/features/entries/server/create-store-entry";
import { listStoreEntries } from "@/features/entries/server/list-store-entries";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ storeId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const params = await context.params;
    const requestContext = resolveRequestContext(request, { requireUser: true });
    const { searchParams } = new URL(request.url);

    const statusRaw = searchParams.get("status") || "all";
    if (statusRaw !== "active" && statusRaw !== "voided" && statusRaw !== "all") {
      throw new ValidationError("Query param 'status' must be one of: active, voided, all.");
    }

    const limitRaw = searchParams.get("limit");
    const parsedLimit = limitRaw ? Number(limitRaw) : undefined;
    if (typeof parsedLimit === "number" && (!Number.isInteger(parsedLimit) || parsedLimit <= 0)) {
      throw new ValidationError("Query param 'limit' must be a positive integer.");
    }

    const result = await listStoreEntries({
      organizationId: requestContext.organizationId,
      storeId: params.storeId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      status: statusRaw,
      limit: parsedLimit ?? 500,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const params = await context.params;
    const requestContext = resolveRequestContext(request, { requireUser: true });
    const body = await request.json();

    const result = await createStoreEntry({
      organizationId: requestContext.organizationId,
      storeId: params.storeId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      date: body?.date,
      type: body?.type,
      amountHalalas: body?.amountHalalas,
      categoryId: body?.categoryId,
      note: body?.note,
      salesChannels: Array.isArray(body?.salesChannels) ? body.salesChannels : [],
    });

    return ok(result, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
