import { ValidationError } from "@/core/errors/app-error";
import { withAuthedApiRoute } from "@/core/http/api-route-handler";
import { getStorePeriodSummary } from "@/features/reports/server/get-store-period-summary";
import { monthToDateRange } from "@/features/reports/server/report-date-range";

export const dynamic = "force-dynamic";

export const GET = withAuthedApiRoute<{ storeId: string }>(async ({ auth, params, searchParams }) => {
  const month = searchParams.get("month");
  if (!month) {
    throw new ValidationError("Query param 'month' is required.");
  }

  const range = monthToDateRange(month);
  const summary = await getStorePeriodSummary({
    organizationId: auth.organizationId,
    storeId: params.storeId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    from: range.from,
    to: range.to,
  });

  return {
    ...summary,
    month,
  };
});
