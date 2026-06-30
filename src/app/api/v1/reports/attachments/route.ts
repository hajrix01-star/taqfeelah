import { withAuthedApiRouteNoParams } from "@/core/http/api-route-handler";
import { getStoreAttachmentsReport } from "@/features/reports/server/get-store-attachments-report";
import { parseReportRouteQuery } from "@/features/reports/server/parse-report-route-query";

export const dynamic = "force-dynamic";

export const GET = withAuthedApiRouteNoParams(({ auth, searchParams }) => {
  const query = parseReportRouteQuery(searchParams);
  return getStoreAttachmentsReport({
    organizationId: auth.organizationId,
    storeId: query.storeId,
    actorUserId: auth.userId,
    actorRole: auth.role,
    from: query.from,
    to: query.to,
  });
});
