import { ok, fail } from "@/core/http/api-response";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { getStoreDaySummary } from "@/features/reports/server/get-store-day-summary";
import { recordStoreDaySummarySnapshot } from "@/features/reports/server/record-store-day-summary-snapshot";

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
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (!date) {
      throw new ValidationError("Query param 'date' is required.");
    }

    const requestContext = resolveRequestContext(request, { requireUser: true });

    const summary = await getStoreDaySummary({
      storeId: params.storeId,
      date,
      organizationId: requestContext.organizationId,
      actorUserId: requestContext.userId ?? undefined,
      actorRole: requestContext.role ?? undefined,
    });

    return ok(summary);
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
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (!date) {
      throw new ValidationError("Query param 'date' is required.");
    }

    const requestContext = resolveRequestContext(request, { requireUser: true });
    const body = await request.json();
    const totalSalesHalalas = Number(body?.totalSalesHalalas);
    const totalOutflowHalalas = Number(body?.totalOutflowHalalas);
    const note = typeof body?.note === "string" ? body.note : undefined;

    if (!Number.isInteger(totalSalesHalalas) || totalSalesHalalas < 0) {
      throw new ValidationError("Body field 'totalSalesHalalas' must be a non-negative integer.");
    }
    if (!Number.isInteger(totalOutflowHalalas) || totalOutflowHalalas < 0) {
      throw new ValidationError("Body field 'totalOutflowHalalas' must be a non-negative integer.");
    }

    const snapshot = await recordStoreDaySummarySnapshot({
      storeId: params.storeId,
      date,
      organizationId: requestContext.organizationId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      totalSalesHalalas,
      totalOutflowHalalas,
      note,
    });

    const computed = await getStoreDaySummary({
      storeId: params.storeId,
      date,
      organizationId: requestContext.organizationId,
    });

    return ok(
      {
        ...computed,
        snapshot: {
          id: snapshot.id,
          createdAt: snapshot.createdAt,
          totalSalesHalalas,
          totalOutflowHalalas,
          netMovementHalalas: totalSalesHalalas - totalOutflowHalalas,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return fail(error);
  }
}
