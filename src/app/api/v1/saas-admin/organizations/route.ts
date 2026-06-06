import { fail, ok } from "@/core/http/api-response";
import { isSaasAdminApiEnabled } from "@/core/config/saas-admin-api-mode";
import { ServiceUnavailableError, ValidationError } from "@/core/errors/app-error";
import { readEnv } from "@/core/config/env";
import { resolveRequestContext } from "@/core/auth/request-context";
import { listSaasOrganizations } from "@/features/saas-admin/server/list-saas-organizations";

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
    const statusRaw = searchParams.get("status") || "all";
    if (statusRaw !== "active" && statusRaw !== "suspended" && statusRaw !== "all") {
      throw new ValidationError("Query param 'status' must be one of: active, suspended, all.");
    }
    const limitRaw = Number(searchParams.get("limit") || "50");

    const result = await listSaasOrganizations({
      actorUserId: requestContext.userId!,
      status: statusRaw,
      limit: Number.isInteger(limitRaw) ? limitRaw : 50,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
