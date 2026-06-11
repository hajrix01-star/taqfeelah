import { fail, ok } from "@/core/http/api-response";
import { isSaasAdminApiEnabled } from "@/core/config/saas-admin-api-mode";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { getInvestorDashboard } from "@/features/saas-admin/server/get-investor-dashboard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    if (!isSaasAdminApiEnabled()) {
      throw new ServiceUnavailableError("SaaS admin API is disabled.");
    }

    const env = readEnv();
    if (!env.DATABASE_URL) {
      throw new ServiceUnavailableError("DATABASE_URL is not configured.");
    }

    const requestContext = resolveRequestContext(request, { requireUser: true });
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!from || !to) {
      throw new ValidationError("Query params 'from' and 'to' are required (YYYY-MM-DD).");
    }

    const result = await getInvestorDashboard({
      actorUserId: requestContext.userId!,
      from,
      to,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
