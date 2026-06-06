import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { getStorePeriodSummary } from "@/features/reports/server/get-store-period-summary";
import { monthToDateRange } from "@/features/reports/server/report-date-range";

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
    const month = searchParams.get("month");
    if (!month) {
      throw new ValidationError("Query param 'month' is required.");
    }

    const requestContext = resolveRequestContext(request, { requireUser: true });
    const range = monthToDateRange(month);
    const summary = await getStorePeriodSummary({
      organizationId: requestContext.organizationId,
      storeId: params.storeId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      from: range.from,
      to: range.to,
    });

    return ok({
      ...summary,
      month,
    });
  } catch (error) {
    return fail(error);
  }
}
