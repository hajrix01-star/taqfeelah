import { ValidationError } from "@/core/errors/app-error";
import { withAuthedApiRouteNoParams } from "@/core/http/api-route-handler";
import { getRegisterOverview } from "@/features/entries/server/get-register-overview";
import { assertBoundedReportRange, monthToDateRange } from "@/features/reports/server/report-date-range";

export const dynamic = "force-dynamic";

export const GET = withAuthedApiRouteNoParams(({ auth, searchParams }) => {
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

  return getRegisterOverview({
    organizationId: auth.organizationId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    storeIds,
    from: range.from,
    to: range.to,
    period,
  });
});
