import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { getRegisterOverview } from "@/features/entries/server/get-register-overview";
import { assertBoundedReportRange, monthToDateRange } from "@/features/reports/server/report-date-range";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const requestContext = resolveRequestContext(request, { requireUser: true });
    const { searchParams } = new URL(request.url);
    const storeIds = (searchParams.get("storeIds") || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (!storeIds.length) {
      throw new ValidationError("Query param 'storeIds' is required.");
    }

    const period = searchParams.get("period") || "day";
    if (period !== "day" && period !== "month" && period !== "year" && period !== "custom") {
      throw new ValidationError("Query param 'period' must be one of: day, month, year, custom.");
    }

    let from = searchParams.get("from") || "";
    let to = searchParams.get("to") || "";
    const month = searchParams.get("month") || "";
    const date = searchParams.get("date") || "";
    if (period === "month" && month) {
      const range = monthToDateRange(month);
      from = range.from;
      to = range.to;
    } else if (period === "day" && date) {
      from = date;
      to = date;
    }
    const range = assertBoundedReportRange(from, to);

    const result = await getRegisterOverview({
      organizationId: requestContext.organizationId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      storeIds,
      from: range.from,
      to: range.to,
      period,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
