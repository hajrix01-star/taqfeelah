import { ok, fail } from "@/core/http/api-response";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { getStoreDaySummary } from "@/features/reports/server/get-store-day-summary";

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

    // Temporary organization context source until session auth is introduced.
    const organizationId = request.headers.get("x-organization-id");
    if (!organizationId) {
      throw new ValidationError("Header 'x-organization-id' is required.");
    }

    const summary = await getStoreDaySummary({
      storeId: params.storeId,
      date,
      organizationId,
    });

    return ok(summary);
  } catch (error) {
    return fail(error);
  }
}
