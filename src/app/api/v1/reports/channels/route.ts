import { fail, ok } from "@/core/http/api-response";
import { ServiceUnavailableError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { getStoreChannelsReport } from "@/features/reports/server/get-store-channels-report";
import { parseReportRouteQuery } from "@/features/reports/server/parse-report-route-query";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const requestContext = resolveRequestContext(request, { requireUser: true });
    const query = parseReportRouteQuery(new URL(request.url).searchParams);
    const report = await getStoreChannelsReport({
      organizationId: requestContext.organizationId,
      storeId: query.storeId,
      actorUserId: requestContext.userId!,
      actorRole: requestContext.role!,
      from: query.from,
      to: query.to,
    });

    return ok(report);
  } catch (error) {
    return fail(error);
  }
}
