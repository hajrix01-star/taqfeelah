import { ValidationError } from "@/core/errors/app-error";
import { withAuthedApiRouteNoParams } from "@/core/http/api-route-handler";
import { getNotebookExport } from "@/features/exports/server/get-notebook-export";
import { monthToDateRange } from "@/features/reports/server/report-date-range";

export const dynamic = "force-dynamic";

export const GET = withAuthedApiRouteNoParams(({ auth, searchParams }) => {
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

  return getNotebookExport({
    organizationId: auth.organizationId,
    storeId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    from,
    to,
    period: periodRaw,
  });
});
