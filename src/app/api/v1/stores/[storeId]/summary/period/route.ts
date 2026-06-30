import { ValidationError } from "@/core/errors/app-error";
import { withAuthedApiRoute } from "@/core/http/api-route-handler";
import { getStorePeriodSummary } from "@/features/reports/server/get-store-period-summary";

export const dynamic = "force-dynamic";

export const GET = withAuthedApiRoute<{ storeId: string }>(({ auth, params, searchParams }) => {
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) {
    throw new ValidationError("Query params 'from' and 'to' are required.");
  }

  return getStorePeriodSummary({
    organizationId: auth.organizationId,
    storeId: params.storeId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    from,
    to,
  });
});
