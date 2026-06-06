import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { getNotebookExport } from "@/features/exports/server/get-notebook-export";
import { monthToDateRange } from "@/features/reports/server/report-date-range";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const requestContext = resolveRequestContext(request, { requireUser: true });
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");
    if (!storeId) {
      throw new ValidationError("Query param 'storeId' is required.");
    }

    const periodRaw = searchParams.get("period") || "day";
    if (periodRaw !== "day" && periodRaw !== "month" && periodRaw !== "year" && periodRaw !== "custom") {
      throw new ValidationError("Query param 'period' must be one of: day, month, year, custom.");
    }

    let from = searchParams.get("from") || "";
    let to = searchParams.get("to") || "";
    const month = searchParams.get("month") || "";
    const date = searchParams.get("date") || "";

    if (periodRaw === "month" && month) {
      const range = monthToDateRange(month);
      from = range.from;
      to = range.to;
    } else if (periodRaw === "day" && date) {
      from = date;
      to = date;
    }

    if (!from || !to) {
      throw new ValidationError("Query params 'from' and 'to' (or 'date' / 'month') are required.");
    }

    const result = await getNotebookExport({
      organizationId: requestContext.organizationId,
      storeId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      from,
      to,
      period: periodRaw,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
